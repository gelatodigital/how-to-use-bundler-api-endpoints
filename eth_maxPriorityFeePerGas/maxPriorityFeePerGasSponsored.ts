/**************************************************************************
 *  Gelato bundler → eth_maxPriorityFeePerGas (Sponsored Mode)            *
 *                                                                        *
 *  ENV required                                                          *
 *  ────────────────────────────────────────────────────────────────────── *
 *  GELATO_API_KEY   1Balance sponsor key (REQUIRED)                      *
 *  CHAIN_ID         default 11155111 (Sepolia)                           *
 **************************************************************************/
import 'dotenv/config';

const apiKey  = process.env.GELATO_API_KEY;
const chainId = process.env.CHAIN_ID ?? '11155111'; // Sepolia default

if (!apiKey) {
  throw new Error('Missing GELATO_API_KEY in .env - Required for sponsored mode');
}

const bundlerUrl = `https://api.gelato.digital/bundlers/${chainId}/rpc?sponsorApiKey=${apiKey}`;

const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_maxPriorityFeePerGas',
  params: [],
};

(async () => {
  console.log('➡️  Requesting maxPriorityFee (Sponsored Mode)…');
  console.log(`🔑 Using API Key: ${apiKey.slice(0, 10)}...`);
  
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