/**************************************************************************
 *  Query Gelato bundler → eth_getUserOperationByHash                      *
 *                                                                        *
 *  ENV required:                                                         *
 *    GELATO_API_KEY   (1Balance sponsor key)                             *
 *    CHAIN_ID         (default 11155111 for Sepolia)                     *
 *                                                                        *
 *  Usage: HASH=0xabc… pnpm ts-node getUserOperationByHash.ts             *
 **************************************************************************/
import 'dotenv/config';

const apiKey   = process.env.GELATO_API_KEY!;
const chainId  = process.env.CHAIN_ID ?? '11155111';
const hash     = process.env.HASH;                 // pass with HASH=0x…

if (!apiKey)   throw new Error('Missing GELATO_API_KEY in .env');
if (!hash)     throw new Error('Provide HASH env var (userOpHash to query)');

const bundlerUrl =
  `https://api.gelato.digital/bundlers/${chainId}/rpc?sponsorApiKey=${apiKey}`;

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
