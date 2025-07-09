import 'dotenv/config';

async function main() {
  const CHAIN_ID = process.env.CHAIN_ID ?? '84532';
  const API_KEY  = process.env.GELATO_API_KEY;

  if (!API_KEY) throw new Error('Missing SPONSOR_API_KEY in .env');

  const bundlerUrl =
    `https://api.gelato.digital/bundlers/${CHAIN_ID}/rpc?sponsorApiKey=${API_KEY}`;

  // JSON-RPC 2.0 body
  const payload = {
    id: 1,
    jsonrpc: '2.0',
    method: 'eth_chainId',
    params: [],
  };

  const res = await fetch(bundlerUrl, {
    method : 'POST',
    headers: { 'content-type': 'application/json' },
    body   : JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }

  const { result } = await res.json() as { result: `0x${string}` };

  console.log('Bundler responded:');
  console.log('  Chain Id:', result);
}

main().catch((err) => {
  console.error('❌  Bundler call failed:', err);
  process.exit(1);
});
