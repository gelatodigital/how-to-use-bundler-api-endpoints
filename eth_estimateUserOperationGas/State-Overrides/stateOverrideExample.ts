import "dotenv/config";
import { createPublicClient, http } from "viem";
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from "viem/account-abstraction";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
import { sepolia } from "viem/chains";

/*
 * In this example, we are using a state override to estimate the gas for a user operation.
 * The state override is used to set the balance of the newly created account to 100 ETH.
 * This is a native gas payment example, so it will not work without a state override for newly created non-funded accounts.
 */

type GasPrices = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

type EthGetUserOperationGasPriceRpc = {
  ReturnType: GasPrices;
  Parameters: [];
};

type UserOperation = ViemUserOperation;

const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // v0.7
const chain = sepolia;
const chainID = chain.id; // 11155111

const PRIVATE_KEY = generatePrivateKey();

if (!PRIVATE_KEY) throw new Error("Set PRIVATE_KEY in .env");

/* ───────────────── 1. viem public client & signer ───────────────────── */
const publicClient = createPublicClient({ chain, transport: http() });
const signer = privateKeyToAccount(PRIVATE_KEY as any);

/* ───────────────── 2. Circle smart account (Circle SDK) ──────────────── */
const account = await toCircleSmartAccount({
  client: publicClient,
  owner: signer,
});
console.log("Circle Smart Account address:", account.address);

/* ───────────────── 3. Bundler client (helpers only) ─────────────────── */
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainID}/rpc`;

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

/* ───────────────── 4. Prepare UserOperation with state override ──── */
let userOp: UserOperation = await bundlerClient.prepareUserOperation({
  account,
  stateOverride: [
    {
      address: account.address,
      balance: 100000000000000000000n,
    },
  ],
  calls: [{ to: account.address, value: 0n, data: "0x" }],
});

/* ───────────────── 5. Shape payload for v0.7 RPC spec ────────────────── */
const toHex = (n: bigint) => `0x${n.toString(16)}` as const;

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
  maxFeePerGas: toHex(userOp.maxFeePerGas),
  maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
  signature: userOp.signature, // dummy for estimation
};

const stateOverride = {
  [account.address]: {
    //code: "",
    //nonce: "",
    balance: toHex(100000000000000000000n),
    //state:{},      /** Fake key-value mapping to override all slots in the account storage before executing the call. */
    //stateDiff:{},  /** Fake key-value mapping to override individual slots in the account storage before executing the call. */
  },
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
    params: [rpcUserOp, ENTRY_POINT, stateOverride],
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
