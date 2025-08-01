import 'dotenv/config';

const chainId = process.env.CHAIN_ID ?? '11155111';
const GELATO_API_KEY = process.env.GELATO_API_KEY;  
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainId}/rpc?apiKey=${GELATO_API_KEY}`;

const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_supportedEntryPoints',
  params: [],
};

(async () => {
  console.log('➡️  Requesting supported entry points …');
  const res = await fetch(bundlerUrl, {
    method : 'POST',
    headers: { 'content-type': 'application/json' },
    body   : JSON.stringify(body),
  }).then(r => r.json());

  if (res.result) {
    console.log('✅  Supported entry points:', res.result);
  } else {
    console.error('❌  Gelato error:\n', res.error || res);
    process.exit(1);
  }
})(); 