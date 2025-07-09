/**************************************************************************
 *  Gelato bundler → eth_maxPriorityFeePerGas (Native Mode)               *
 *                                                                        *
 *  ENV required                                                          *
 *  ────────────────────────────────────────────────────────────────────── *
 *  GELATO_API_KEY   Optional (not used in native mode)                   *
 *  CHAIN_ID         default 11155111 (Sepolia)                           *
 **************************************************************************/
import 'dotenv/config';

const chainId = process.env.CHAIN_ID ?? '11155111'; // Sepolia default

// In native mode, we don't use the API key
const bundlerUrl = `https://api.gelato.digital/bundlers/${chainId}/rpc`;

const body = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_maxPriorityFeePerGas',
  params: [],
};

(async () => {
  console.log('➡️  Requesting maxPriorityFee (Native Mode)…');
  console.log('💸 Mode: Native (no sponsorship)');
  
  const res = await fetch(bundlerUrl, {
    method : 'POST',
    headers: { 'content-type': 'application/json' },
    body   : JSON.stringify(body),
  }).then(r => r.json());

  if (res.result) {
    const gwei = parseInt(res.result, 16) / 1e9;
    console.log(`✅  maxPriorityFeePerGas: ${res.result}  (~${gwei} gwei)`);
    console.log('💡 Note: In native mode, you pay gas fees yourself');
  } else {
    console.error('❌  Gelato error:\n', res.error || res);
    process.exit(1);
  }
})(); 