import "dotenv/config";
import { createPublicClient, encodePacked, hexToBigInt, http, zeroAddress } from "viem";
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from "viem/account-abstraction";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { toCircleSmartAccount } from "@circle-fin/modular-wallets-core";
import { signPermit } from "./signPermit.ts";

type GasPrices = {
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
};

type EthGetUserOperationGasPriceRpc = {
  ReturnType: GasPrices;
  Parameters: [];
};
const ENTRY_POINT = "0x0000000071727De22E5E9d8BAf0edAc6f37da032"; // v0.7
const chain = baseSepolia;
const chainID = chain.id; // 84532

const PRIVATE_KEY = process.env.PRIVATE_KEY!;
const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const PAYMASTER_ADDRESS = "0x31BE08D380A21fc740883c0BC434FcFc88740b58";


/* ───────────────── 1. viem public client & signer ───────────────────── */
const client = createPublicClient({ chain, transport: http() });
const owner = privateKeyToAccount(PRIVATE_KEY as any);

/* ───────────────── 2. Circle smart account (Circle SDK) ──────────────── */
const account = await toCircleSmartAccount({ client, owner });
console.log("Circle Smart Account address:", account.address);

/* ───────────────── 3. Bundler client (helpers only) ─────────────────── */
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainID}/rpc`;

const paymaster = {
  async getPaymasterData(parameters) {
    const permitAmount = 10000000n;
    const permitSignature = await signPermit({
      tokenAddress: USDC_ADDRESS,
      account,
      client,
      spenderAddress: PAYMASTER_ADDRESS,
      permitAmount: permitAmount,
    });

    const paymasterData = encodePacked(
      ["uint8", "address", "uint256", "bytes"],
      [0, USDC_ADDRESS as `0x${string}`, permitAmount, permitSignature]
    );

    return {
      paymaster: PAYMASTER_ADDRESS,
      paymasterData,
      paymasterVerificationGasLimit: 200000n,
      paymasterPostOpGasLimit: 15000n,
      isFinal: true,
    };
  },
};

const bundlerClient = createBundlerClient({
  account,
  client,
  paymaster: paymaster as any,
  paymasterContext: {
    token: USDC_ADDRESS, // Setting ERC-20 token for gas fees
  },
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
  transport: http(bundlerUrl),
});


/* ───────────────── 4. Prepare zero-fee UserOperation ────────────────── */
let userOp = await bundlerClient.prepareUserOperation({
  account,
  calls: [{ to: zeroAddress, value: 0n, data: "0x" }],
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
  signature: userOp.signature,
  maxFeePerGas: toHex(userOp.maxFeePerGas),
  maxPriorityFeePerGas: toHex(userOp.maxPriorityFeePerGas),
  paymaster: userOp.paymaster,
  paymasterData: userOp.paymasterData
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
