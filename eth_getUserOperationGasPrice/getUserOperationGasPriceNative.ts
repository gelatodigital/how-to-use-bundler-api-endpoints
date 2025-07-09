/**************************************************************************
 *  eth_getUserOperationGasPrice – Native Mode                             *
 *                                                                        *
 *  ENV:                                                                   *
 *    CHAIN_ID        default 11155111 (Sepolia)                          *
 **************************************************************************/
import 'dotenv/config';

const chainId   = process.env.CHAIN_ID  ?? '11155111';

const bundlerUrl = `https://api.gelato.digital/bundlers/${chainId}/rpc`;

const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_getUserOperationGasPrice',
  params: [],
};

const toGwei = (x: `0x${string}`) => parseInt(x, 16) / 1e9;

(async () => {
  console.log('➡️  Requesting gas price (Native Mode)…');
  console.log('💸 Mode: Native (no sponsorship)');
  
  const { result, error } = await fetch(bundlerUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json());

  if (result) {
    console.log('✅  Response:');
    console.log(
      `   maxPriorityFeePerGas: ${result.maxPriorityFeePerGas}  (~${toGwei(
        result.maxPriorityFeePerGas
      )} gwei)`
    );
    console.log(
      `   maxFeePerGas:        ${result.maxFeePerGas}  (~${toGwei(
        result.maxFeePerGas
      )} gwei)`
    );
    console.log('💡 Note: In native mode, you pay gas fees yourself');
  } else {
    console.error('❌  Gelato error:\n', error);
    process.exit(1);
  }
})(); 