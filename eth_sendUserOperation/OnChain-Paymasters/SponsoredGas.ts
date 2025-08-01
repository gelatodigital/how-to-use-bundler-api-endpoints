import "dotenv/config";
import { createPublicClient, http, zeroAddress } from "viem";
import { createBundlerClient } from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
import { sepolia } from "viem/chains";
import { createPaymasterClient } from "viem/account-abstraction";

type GasPrices = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

type EthGetUserOperationGasPriceRpc = {
  ReturnType: GasPrices;
  Parameters: [];
};
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // v0.7
const chain = sepolia;
const chainID = chain.id; // 11155111
const GELATO_API_KEY = process.env.GELATO_API_KEY;

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const PAYMASTER_URL = process.env.PAYMASTER_URL!;

if (!PRIVATE_KEY || !PAYMASTER_URL)
  throw new Error("PRIVATE_KEY & PAYMASTER_URL in .env");

/* ───────────────── 1. viem public client & signer ───────────────────── */
const publicClient = createPublicClient({ chain, transport: http() });
const signer = privateKeyToAccount(PRIVATE_KEY as any);

/* ───────────────── 2. Circle account (Circle SDK) ──────────────── */
const account = await toCircleSmartAccount({
  client: publicClient,
  owner: signer,
});
console.log("Circle Smart Account address:", account.address);

/* ───────────────── 3. Bundler client (helpers only) ─────────────────── */
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainID}/rpc?apiKey=${GELATO_API_KEY}`;

const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(bundlerUrl),
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

const paymasterClient = createPaymasterClient({
  transport: http(PAYMASTER_URL),
});

/* ───────────────── 4. Prepare zero-fee UserOperation ────────────────── */
let userOp = await bundlerClient.prepareUserOperation({
  account,
  calls: [{ to: zeroAddress, value: 0n, data: "0x" }],
  paymaster: paymasterClient,
});

const signature = await account.signUserOperation(userOp);
userOp.signature = signature;

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
  callGasLimit: toHex(userOp.callGasLimit),
  verificationGasLimit: toHex(userOp.verificationGasLimit),
  preVerificationGas: toHex(userOp.preVerificationGas),
  signature: userOp.signature,
  paymaster: userOp.paymaster,
  paymasterData: userOp.paymasterData,
  paymasterPostOpGasLimit: toHex(userOp.paymasterPostOpGasLimit ?? 0n),
  paymasterVerificationGasLimit: toHex(
    userOp.paymasterVerificationGasLimit ?? 0n
  ),
  maxFeePerGas: toHex(userOp.maxFeePerGas),
  maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
};

console.log("\nPrepared UserOperation", rpcUserOp);

// ─── 6. Send with fetch (raw eth_sendUserOperation) ─────────────────────
const submitOptions = {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    id: 1,
    jsonrpc: "2.0",
    method: "eth_sendUserOperation",
    params: [rpcUserOp, ENTRY_POINT],
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