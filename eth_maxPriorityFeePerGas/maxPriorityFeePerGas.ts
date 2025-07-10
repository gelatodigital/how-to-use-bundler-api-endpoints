import 'dotenv/config';

const chainId = process.env.CHAIN_ID ?? '11155111'; // Sepolia default

// Note : for native and erc20 payments remove the sponsorApiKey from the url.
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainId}/rpc`;

const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_maxPriorityFeePerGas',
  params: [],
};

(async () => {
  console.log('➡️  Requesting maxPriorityFee (Sponsored Mode)…');
  
  const res = await fetch(bundlerUrl, {
    method : 'POST',
    headers: { 'content-type': 'application/json' },
    body   : JSON.stringify(body),
  }).then(r => r.json());

  if (res.result) {
    const gwei = parseInt(res.result, 16) / 1e9;
    console.log(`✅  maxPriorityFeePerGas: ${res.result}  (~${gwei} gwei)`);
    console.log('💰 Mode: Sponsored (1Balance)');
  } else {
    console.error('❌  Gelato error:\n', res.error || res);
    process.exit(1);
  }
})(); 