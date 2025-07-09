import 'dotenv/config';

const apiKey  = process.env.GELATO_API_KEY!;
const chainId = process.env.CHAIN_ID ?? '11155111';
const hash    = process.env.HASH;

if (!apiKey) throw new Error('Missing GELATO_API_KEY in .env');
if (!hash)   throw new Error('Provide HASH env var (userOpHash to query)');

//ex. HASH=0x1614d689246cabfa884d069bcbde473b1987243e0fe735eecc4fd6aeca6e04bc

const bundlerUrl =
  `https://api.gelato.digital/bundlers/${chainId}/rpc?sponsorApiKey=${apiKey}`;

const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_getUserOperationReceipt',
  params: [hash],
};

(async () => {
  console.log('➡️  Fetching UserOperation receipt …');
  const res = await fetch(bundlerUrl, {
    method : 'POST',
    headers: { 'content-type': 'application/json' },
    body   : JSON.stringify(body),
  }).then(r => r.json());

  if (res.result) {
    console.log('✅  Receipt:\n', JSON.stringify(res.result, null, 2));
  } else {
    console.error('❌  Gelato error:\n', res.error || res);
    process.exit(1);
  }
})(); 