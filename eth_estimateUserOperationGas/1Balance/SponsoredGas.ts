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
import { createPublicClient, http } from "viem";
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { toSafeSmartAccount } from "permissionless/accounts";
import { sepolia } from "viem/chains";


const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // v0.7
const chain = sepolia;
const chainID = chain.id; // 11155111

const apiKey = process.env.GELATO_API_KEY!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

if (!apiKey || !PRIVATE_KEY)
  throw new Error("Set GELATO_API_KEY, RPC_URL & PRIVATE_KEY in .env");

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
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainID}/rpc?sponsorApiKey=${apiKey}`;

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(bundlerUrl),
});

/* ───────────────── 4. Prepare zero-fee UserOperation ────────────────── */
let userOp = await bundlerClient.prepareUserOperation({
  account,
  calls: [{ to: account.address, value: 0n, data: "0x" }],
  maxFeePerGas: 0n,
  maxPriorityFeePerGas: 0n,
});

/* ───────────────── 5. Shape payload for v0.7 RPC spec ──────────────── */
const toHex = (n: bigint) => `0x${n.toString(16)}`;

const rpcUserOp: any = {
  sender: userOp.sender,
  nonce: toHex(userOp.nonce),
  ...(userOp.factory && userOp.factory !== "0x"
    ? {
        factory: userOp.factory,
        factoryData: userOp.factoryData ?? "0x",
      }
    : {}),
  callData: userOp.callData,
  maxFeePerGas: toHex(userOp.maxFeePerGas), // 0x0 for 1Balance
  maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas), // 0x0 for 1Balance
  signature: userOp.signature, // dummy for estimation
};

console.log("\nPrepared UserOperation", rpcUserOp);

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
