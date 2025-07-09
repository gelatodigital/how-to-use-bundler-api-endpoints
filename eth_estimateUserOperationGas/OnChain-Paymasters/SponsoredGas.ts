/**************************************************************************
 *  Sepolia · Safe (permissionless) · eth_estimateUserOperationGas        *
 *                                                                        *
 *  .env variables                                                        *
 *  ───────────────────────────────────────────────────────────────────── *
 *  GELATO_API_KEY   1Balance sponsor key                                 *
 *  PRIVATE_KEY      Safe owner EOA (0x…)                                 *
 *  RPC_URL          HTTPS Sepolia RPC endpoint                           *
 **************************************************************************/

import "dotenv/config";
import { createPublicClient, http, zeroAddress } from "viem";
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { toSafeSmartAccount } from "permissionless/accounts";
import { sepolia } from "viem/chains";
import { createPaymasterClient } from "viem/account-abstraction";

type UserOperation = ViemUserOperation & { paymasterAndData?: `0x${string}` };

const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // v0.7
const chain = sepolia;
const chainID = chain.id; // 11155111

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const PAYMASTER_URL = process.env.PAYMASTER_URL!;

if (!PRIVATE_KEY || !PAYMASTER_URL)
  throw new Error("PRIVATE_KEY & PAYMASTER_URL in .env");

/* ───────────────── 1. viem public client & signer ───────────────────── */
const publicClient = createPublicClient({ chain, transport: http() });
const signer = privateKeyToAccount(PRIVATE_KEY as any);

/* ───────────────── 2. Safe account (Permissionless.js) ──────────────── */
const account = await toSafeSmartAccount({
  client: publicClient,
  entryPoint: { address: ENTRY_POINT, version: "0.7" },
  owners: [signer],
  saltNonce: 0n,
  version: "1.4.1",
});
console.log("Safe address:", account.address);

/* ───────────────── 3. Bundler client (helpers only) ─────────────────── */
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainID}/rpc`;

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(bundlerUrl),
});

const paymasterClient = createPaymasterClient({
  transport: http(PAYMASTER_URL),
});

/* ───────────────── 4. Prepare zero-fee UserOperation ────────────────── */
let userOp = await bundlerClient.prepareUserOperation({
  account,
  calls: [{ to: zeroAddress, value: 0n, data: "0x" }],
  paymaster: paymasterClient,
});

/* ───────────────── 5. Shape payload for v0.7 RPC spec ──────────────── */
const toHex = (n: bigint) => `0x${n.toString(16)}`;

const rpcUserOp: any = {
  sender: userOp.sender,
  nonce: toHex(userOp.nonce),
  callData: userOp.callData,
  signature: userOp.signature,
  paymaster: userOp.paymaster,
  paymasterData: userOp.paymasterData,
  paymasterPostOpGasLimit: toHex(userOp.paymasterPostOpGasLimit ?? 0n),
  paymasterVerificationGasLimit: toHex(userOp.paymasterVerificationGasLimit ?? 0n),
  maxFeePerGas: toHex(userOp.maxFeePerGas),
  maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
};

if (userOp.factory && userOp.factory !== "0x") {
  rpcUserOp.factory = userOp.factory;
  rpcUserOp.factoryData = userOp.factoryData ?? "0x";
}

/* ───────────────── 6. Call eth_estimateUserOperationGas ────────────── */
console.log("\n➡️  Requesting gas estimation …");
const res = await fetch(bundlerUrl, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id: 1,
    jsonrpc: "2.0",
    method: "eth_estimateUserOperationGas",
    params: [rpcUserOp, ENTRY_POINT],
  }),
}).then((r) => r.json());

if (res.result) {
  const gas = res.result as {
    preVerificationGas: `0x${string}`;
    callGasLimit: `0x${string}`;
    verificationGasLimit: `0x${string}`;
  };
  console.log("✅  Estimated gas:", gas);
} else {
  console.error("❌  Bundler error:\n", res.error || res);
  process.exit(1);
}
