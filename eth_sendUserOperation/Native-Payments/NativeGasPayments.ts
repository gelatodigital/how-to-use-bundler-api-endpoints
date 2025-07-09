import "dotenv/config";
import { createPublicClient, http } from "viem";
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
import { sepolia } from "viem/chains";

type GasPrices = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

type EthGetUserOperationGasPriceRpc = {
  ReturnType: GasPrices;
  Parameters: [];
};
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
const chain = sepolia;
const chainID = chain.id;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

if (!PRIVATE_KEY) {
  throw new Error("Missing PRIVATE_KEY in .env");
}

// 1) Public client & signer
const publicClient = createPublicClient({ chain, transport: http() });
const signer = privateKeyToAccount(PRIVATE_KEY as any);

// 2) Build your Circle-style AA account
const account = await toCircleSmartAccount({ client: publicClient, owner: signer });
console.log("Circle Smart Account address:", account.address);

// 3) “Bundler” = your node’s eth_sendUserOperation
const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(`https://api.gelato.digital/bundlers/${chainID}/rpc`),
  userOperation: {
    estimateFeesPerGas: async ({ account, bundlerClient, userOperation }) => {
      const gasPrices =
        await bundlerClient.request<EthGetUserOperationGasPriceRpc>({
          method: "eth_getUserOperationGasPrice",
          params: [],
        });
      return {
        maxFeePerGas: BigInt(gasPrices.maxFeePerGas),
        maxPriorityFeePerGas: BigInt(gasPrices.maxPriorityFeePerGas),
      };
    },
  },
});

// ─── 4. Build & sign the (sponsored) UserOperation ──────────────────────
let userOperation = await bundlerClient.prepareUserOperation({
  account,
  calls: [{ to: account.address, value: 0n, data: "0x" }],
  
});

const signature = await account.signUserOperation(userOperation);
userOperation.signature = signature;

const toHex = (n: bigint) => `0x${n.toString(16)}`;

// ─── 5. Shape payload per Gelato’s v0.7 spec ────────────────────────────
const userOpForSubmission = {
  sender: userOperation.sender,
  nonce: toHex(userOperation.nonce),
  ...(userOperation.factory && userOperation.factory !== "0x"
    ? {
        factory: userOperation.factory,
        factoryData: userOperation.factoryData || "0x",
      }
    : {}),
  callData: userOperation.callData,
  callGasLimit: toHex(userOperation.callGasLimit),
  verificationGasLimit: toHex(userOperation.verificationGasLimit),
  preVerificationGas: toHex(userOperation.preVerificationGas),
  maxFeePerGas: toHex(userOperation.maxFeePerGas),
  maxPriorityFeePerGas: toHex(userOperation.maxPriorityFeePerGas),
  signature: userOperation.signature,
};

console.log("Prepared UserOperation", userOpForSubmission);

// ─── 6. Send with fetch (raw eth_sendUserOperation) ─────────────────────
const submitOptions = {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id: 1,
    jsonrpc: "2.0",
    method: "eth_sendUserOperation",
    params: [userOpForSubmission, ENTRY_POINT],
  }),
};

console.log("\nSubmitting UserOperation to Gelato …");
const res = await fetch(
  `https://api.gelato.digital/bundlers/${chainID}/rpc`,
  submitOptions
).then((r) => r.json());

if (res.result) {
  console.log("✅  userOpHash:", res.result);
  console.log(
    `🔎  Track: https://api.gelato.digital/tasks/status/${res.result}`
  );
} else {
  console.error("❌  Error from Gelato:", res.error || res);
  process.exit(1);
}
