import 'dotenv/config';

const chainId = process.env.CHAIN_ID ?? '11155111';
const hash =
  "0x324af57c611ebafc0da977dc968cf16f95726221d51cada4ccb423603378a1a5"; // add your user operation hash here
//ex. HASH=0x1614d689246cabfa884d069bcbde473b1987243e0fe735eecc4fd6aeca6e04bc

const bundlerUrl =
  `https://api.gelato.digital/bundlers/${chainId}/rpc`;

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