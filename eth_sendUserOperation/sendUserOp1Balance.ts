import 'dotenv/config';

import { createPublicClient, http } from 'viem';
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { sepolia } from 'viem/chains';

type UserOperation = ViemUserOperation & { paymasterAndData?: `0x${string}` };

const ENTRY_POINT = '0x0000000071727De22E5E9d8BAf0edAc6f37da032'; 
const chain = sepolia;
const chainID = chain.id;                                      
const apiKey = process.env.GELATO_API_KEY!;                   
const RPC_URL = process.env.RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

if (!apiKey || !RPC_URL || !PRIVATE_KEY) {
  throw new Error('Missing GELATO_API_KEY, RPC_URL or PRIVATE_KEY in .env');
}

// ─── 1. viem public client & signer ─────────────────────────────────────
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const signer = privateKeyToAccount(PRIVATE_KEY);

// ─── 2. Safe smart account (Permissionless.js) ──────────────────────────
const account = await toSafeSmartAccount({
  client: publicClient,
  entryPoint: { address: ENTRY_POINT, version: '0.7' },
  owners: [signer],
  saltNonce: 0n,
  version: '1.4.1',
});

// ─── 3. Gelato bundler client ───────────────────────────────────────────
const bundlerClient = createBundlerClient({
  client: publicClient,
  transport: http(
    `https://api.gelato.digital/bundlers/${chainID}/rpc?sponsorApiKey=${apiKey}`
  ),
});

// ─── 4. Build & sign the (sponsored) UserOperation ──────────────────────
let userOperation = await bundlerClient.prepareUserOperation({
  account,
  calls: [{ to: account.address, value: 0n, data: '0x' }],
  maxFeePerGas: 0n,
  maxPriorityFeePerGas: 0n,
});

userOperation = {
  ...userOperation,
  preVerificationGas: 0n,
  maxFeePerGas: 0n,
  maxPriorityFeePerGas: 0n,
  paymasterAndData: '0x',
};

const sig = await account.signUserOperation(userOperation);
userOperation.signature = typeof sig === 'string' ? sig : sig.signature;

console.log(
  'UserOp signature:',
  userOperation.signature.slice(0, 20) + '…'
);

// ─── 5. Shape payload per Gelato’s v0.7 spec ────────────────────────────
const userOpForSubmission = {
  sender:  userOperation.sender,
  nonce:   '0x' + userOperation.nonce.toString(16),
  ...(userOperation.factory && userOperation.factory !== '0x'
    ? { factory: userOperation.factory, factoryData: userOperation.factoryData || '0x' }
    : {}),
  callData:             userOperation.callData,
  callGasLimit:         '0x' + userOperation.callGasLimit.toString(16),
  verificationGasLimit: '0x' + userOperation.verificationGasLimit.toString(16),
  preVerificationGas:   '0x0',
  maxFeePerGas:         '0x0',
  maxPriorityFeePerGas: '0x0',
  signature:            userOperation.signature,
};

// ─── 6. Send with fetch (raw eth_sendUserOperation) ─────────────────────
const submitOptions = {
  method : 'POST',
  headers: { 'content-type': 'application/json' },
  body   : JSON.stringify({
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_sendUserOperation',
    params: [userOpForSubmission, ENTRY_POINT],
  }),
};

console.log('\nSubmitting UserOperation to Gelato …');
const res = await fetch(
  `https://api.gelato.digital/bundlers/${chainID}/rpc?sponsorApiKey=${apiKey}`,
  submitOptions
).then(r => r.json());

if (res.result) {
  console.log('✅  userOpHash:', res.result);
  console.log(`🔎  Track: https://api.gelato.digital/tasks/status/${res.result}`);
} else {
  console.error('❌  Error from Gelato:', res.error || res);
  process.exit(1);
}
