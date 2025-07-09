import "dotenv/config";
import { createPublicClient, http } from "viem";
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { toSafeSmartAccount } from "permissionless/accounts";
import { sepolia } from "viem/chains";

const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
const chain = sepolia;
const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error("Missing RPC_URL or PRIVATE_KEY in .env");
}

// 1) Public client & signer
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const signer = privateKeyToAccount(PRIVATE_KEY as any);

// 2) Build your Safe-style AA account
const account = await toSafeSmartAccount({
  client: publicClient,
  entryPoint: { address: ENTRY_POINT, version: "0.7" },
  owners: [signer],
  saltNonce: 0n,
  version: "1.4.1",
});

// 3) “Bundler” = your node’s eth_sendUserOperation
const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(RPC_URL),
});

// 4) Prepare & sign with real gas values
let userOp = await bundlerClient.prepareUserOperation({
  account,
  calls: [{ to: account.address, value: 0n, data: "0x" }],
});

const signature = await account.signUserOperation(userOp);
userOp.signature = signature;

const toHex = (n: bigint) => `0x${n.toString(16)}`;
// 5) Serialize fields to hex-strings
const payload = {
  sender: userOp.sender,
  nonce: toHex(userOp.nonce),
  ...(userOp.factory && userOp.factory !== "0x"
    ? {
        factory: userOp.factory,
        factoryData: userOp.factoryData || "0x",
      }
    : {}),
  callData: userOp.callData,
  callGasLimit: toHex(userOp.callGasLimit),
  verificationGasLimit: toHex(userOp.verificationGasLimit),
  preVerificationGas: toHex(userOp.preVerificationGas),
  maxFeePerGas: toHex(userOp.maxFeePerGas),
  maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
  signature: userOp.signature,
};

console.log("Prepared UserOperation", payload);

// 6) Submit via eth_sendUserOperation
console.log("⏳ Submitting UserOperation…");
const submitRes = await fetch(RPC_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    id: 1,
    jsonrpc: "2.0",
    method: "eth_sendUserOperation",
    params: [payload, ENTRY_POINT],
  }),
}).then((r) => r.json());

if (!submitRes.result) {
  console.error("❌ Submission failed:", submitRes.error || submitRes);
  process.exit(1);
}

const userOpHash = submitRes.result;
console.log("✅ userOpHash:", userOpHash);

// 7) Poll for inclusion via eth_getUserOperationReceipt
console.log("⏳ Waiting for UserOperationReceipt…");
let receipt: any = null;
while (receipt === null) {
  const statusRes = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: 2,
      jsonrpc: "2.0",
      method: "eth_getUserOperationReceipt",
      params: [userOpHash],
    }),
  }).then((r) => r.json());

  receipt = statusRes.result;
  if (receipt === null) {
    console.log("…still pending, retrying in 5 s");
    await new Promise((r) => setTimeout(r, 5000));
  } else {
    console.log("✅ Mined UserOperationReceipt:", receipt);
  }
}
