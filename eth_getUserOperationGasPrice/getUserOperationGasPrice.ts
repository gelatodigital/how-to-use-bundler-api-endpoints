import 'dotenv/config';

const chainId   = process.env.CHAIN_ID  ?? '421614';
const apiKey    = process.env.GELATO_API_KEY ?? '';

if (!apiKey)
  throw new Error('Missing GELATO_API_KEY in .env - Required for sponsored mode');

// for native and erc20 remove the sponsorApiKey from the url.
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainId}/rpc`;

const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_getUserOperationGasPrice',
  params: [],
};

const toGwei = (x: `0x${string}`) => parseInt(x, 16) / 1e9;

(async () => {
  console.log('➡️  Requesting gas price (Sponsored Mode)…');
  
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
    console.log('💰 Mode: Sponsored (1Balance)');
  } else {
    console.error('❌  Gelato error:\n', error);
    process.exit(1);
  }
})(); 