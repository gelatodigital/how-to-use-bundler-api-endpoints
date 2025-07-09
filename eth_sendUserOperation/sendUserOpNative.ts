import 'dotenv/config';
import { createPublicClient, http } from 'viem';
import {
  createBundlerClient,
  type UserOperation as ViemUserOperation,
} from 'viem/account-abstraction';
import { privateKeyToAccount } from 'viem/accounts';
import { toSafeSmartAccount } from 'permissionless/accounts';
import { sepolia } from 'viem/chains';

type UserOperation = ViemUserOperation;

const ENTRY_POINT = '0x0000000071727De22E5E9d8BAf0edAc6f37da032';
const chain      = sepolia;
const RPC_URL    = process.env.RPC_URL!;
const PRIVATE_KEY= process.env.PRIVATE_KEY!;

if (!RPC_URL || !PRIVATE_KEY) {
  throw new Error('Missing RPC_URL or PRIVATE_KEY in .env');
}

// 1) Public client & signer
const publicClient = createPublicClient({ chain, transport: http(RPC_URL) });
const signer       = privateKeyToAccount(PRIVATE_KEY);

// 2) Build your Safe-style AA account
const account = await toSafeSmartAccount({
  client:     publicClient,
  entryPoint: { address: ENTRY_POINT, version: '0.7' },
  owners:     [signer],
  saltNonce:  0n,
  version:    '1.4.1',
});

// 3) “Bundler” = your node’s eth_sendUserOperation
const bundlerClient = createBundlerClient({
  client:    publicClient,
  transport: http(RPC_URL),
});

// 4) Prepare & sign with real gas values
let userOp = await bundlerClient.prepareUserOperation({
  account,
  calls:               [{ to: account.address, value: 0n, data: '0x' }],
  maxFeePerGas:        BigInt(50e9),  // 50 gwei
  maxPriorityFeePerGas:BigInt(2e9),   // 2 gwei
});
const sig = await account.signUserOperation(userOp);
userOp.signature = typeof sig === 'string' ? sig : sig.signature;

// 5) Serialize fields to hex-strings
const payload = {
  sender:               userOp.sender,
  nonce:                '0x' + userOp.nonce.toString(16),
  callData:             userOp.callData,
  callGasLimit:         '0x' + userOp.callGasLimit.toString(16),
  verificationGasLimit: '0x' + userOp.verificationGasLimit.toString(16),
  preVerificationGas:   '0x' + userOp.preVerificationGas.toString(16),
  maxFeePerGas:         '0x' + userOp.maxFeePerGas.toString(16),
  maxPriorityFeePerGas:'0x' + userOp.maxPriorityFeePerGas.toString(16),
  signature:            userOp.signature,
  // include factory/factoryData here if your account isn’t yet deployed
};

// 6) Submit via eth_sendUserOperation
console.log('⏳ Submitting UserOperation…');
const submitRes = await fetch(RPC_URL, {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body:    JSON.stringify({
    id:      1,
    jsonrpc: '2.0',
    method:  'eth_sendUserOperation',
    params:  [payload, ENTRY_POINT],
  }),
}).then(r => r.json());

if (!submitRes.result) {
  console.error('❌ Submission failed:', submitRes.error || submitRes);
  process.exit(1);
}

const userOpHash = submitRes.result;
console.log('✅ userOpHash:', userOpHash);

// 7) Poll for inclusion via eth_getUserOperationReceipt
console.log('⏳ Waiting for UserOperationReceipt…');
let receipt: any = null;
while (receipt === null) {
  const statusRes = await fetch(RPC_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      id:      2,
      jsonrpc: '2.0',
      method:  'eth_getUserOperationReceipt',
      params:  [userOpHash],
    }),
  }).then(r => r.json());

  receipt = statusRes.result;
  if (receipt === null) {
    console.log('…still pending, retrying in 5 s');
    await new Promise((r) => setTimeout(r, 5000));
  } else {
    console.log('✅ Mined UserOperationReceipt:', receipt);
  }
}
