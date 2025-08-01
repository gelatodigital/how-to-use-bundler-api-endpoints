import 'dotenv/config';

const chainId  = process.env.CHAIN_ID ?? '11155111';
const GELATO_API_KEY = process.env.GELATO_API_KEY;

const hash =
  "0x324af57c611ebafc0da977dc968cf16f95726221d51cada4ccb423603378a1a5"; // add your user operation hash here

if (!hash)     throw new Error('Provide HASH env var (userOpHash to query)');

const bundlerUrl =
  `https://api.gelato.digital/bundlers/${chainId}/rpc?apiKey=${GELATO_API_KEY}`;

// build JSON-RPC request body
const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_getUserOperationByHash',
  params: [hash],
};

(async () => {
  console.log('➡️  Fetching user-operation from Gelato …');
  const res = await fetch(bundlerUrl, {
    method : 'POST',
    headers: { 'content-type': 'application/json' },
    body   : JSON.stringify(body),
  }).then(r => r.json());

  if (res.result) {
    console.log('✅  Result:\n', JSON.stringify(res.result, null, 2));
  } else {
    console.error('❌  Error:\n', res.error || res);
    process.exit(1);
  }
})();
