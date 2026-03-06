# eliza-plugin-insumer

ElizaOS plugin for [InsumerAPI](https://insumermodel.com) — privacy-preserving on-chain verification across 32 blockchains.

Verify token balances, NFT ownership, EAS attestations, and wallet trust profiles with ECDSA-signed results that never expose actual balances.

## Install

```bash
npm install eliza-plugin-insumer
```

## Configure

### 1. Get a free API key (instant, no credit card)

Generate one from your terminal — no browser needed:

```bash
curl -s -X POST https://us-central1-insumer-merchant.cloudfunctions.net/createDeveloperApiKey \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "appName": "ElizaOS Agent", "tier": "free"}' | jq .
```

Returns an `insr_live_...` key with 10 credits and 100 calls/day. One free key per email.

Or get one at [insumermodel.com/developers](https://insumermodel.com/developers/).

### 2. Add to your character file

```json
{
  "plugins": ["eliza-plugin-insumer"],
  "settings": {
    "secrets": {
      "INSUMER_API_KEY": "insr_live_your_key_here"
    }
  }
}
```

Or set the environment variable:

```bash
export INSUMER_API_KEY=insr_live_your_key_here
```

## Actions

### VERIFY_WALLET

Verify 1-10 on-chain conditions (token balances, NFT ownership, EAS attestations, Farcaster identity) across 32 chains. Returns ECDSA-signed boolean results.

**Example conversation:**
```
User: Check if 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 holds at least 100 UNI
Agent: [calls VERIFY_WALLET → POST /v1/attest]

Attestation ATST-A7C3E: PASS
  [+] UNI balance >= 100 (chain 1)
1 passed, 0 failed
```

### CHECK_TRUST

Generate a structured wallet trust profile with 17+ checks across stablecoins (USDC on 7 chains), governance tokens (UNI, AAVE, ARB, OP), NFTs (BAYC, Pudgy Penguins, Wrapped CryptoPunks), and staking (stETH, rETH, cbETH). Optional cross-chain with Solana and XRPL wallets.

**Example conversation:**
```
User: What's the trust profile for 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045?
Agent: [calls CHECK_TRUST → POST /v1/trust]

Trust Profile TRST-B2K4F
  stablecoins: 5/7 passed
  governance: 2/4 passed
  nfts: 1/3 passed
  staking: 2/3 passed
Overall: 10/17 checks passed
```

### CHECK_TRUST_BATCH

Profile up to 10 wallets in a single request. 5-8x faster than sequential calls via shared block fetches.

**Example conversation:**
```
User: Check trust for these wallets: 0xd8dA..., 0xAb58..., 0x1234...
Agent: [calls CHECK_TRUST_BATCH → POST /v1/trust/batch]

Batch Trust: 3 profiles
  0xd8dA...: 10/17 checks passed (TRST-B2K4F)
  0xAb58...: 7/17 checks passed (TRST-C3L5G)
  0x1234...: 3/17 checks passed (TRST-D4M6H)
```

## Wallet Auth (JWT)

The VERIFY_WALLET action supports `format: "jwt"` when the user requests a JWT or bearer token. The response includes a standard ES256-signed JWT alongside the attestation, verifiable by any JWT library via the JWKS endpoint at `GET /v1/jwks`. Use this for direct API gateway integration (Kong, Nginx, Cloudflare Access, AWS API Gateway).

## Provider: WALLET_CREDENTIALS

Automatically detects wallet addresses (EVM, Solana, XRPL) in conversation and signals that verification actions are available. Dynamic — only activates when wallet patterns are found.

## Handling `rpc_failure` Errors

If the API cannot reach one or more data sources (RPC nodes, Helius, XRPL, Covalent) after retries, `VERIFY_WALLET` and `CHECK_TRUST` actions return `ok: false` with error code `rpc_failure`. No signature, no JWT, no credits charged. This is a retryable error — the agent should retry after 2-5 seconds.

**Important:** `rpc_failure` is NOT a verification failure. Do not treat it as `pass: false`. It means the data source was temporarily unavailable and the API refused to sign an unverified result.

## Supported Chains (32)

**26 direct-RPC chains:** Ethereum, BNB Chain, Base, Avalanche, Polygon, Arbitrum, Optimism, Chiliz, Soneium, Plume, World Chain, Sonic, Gnosis, Mantle, Scroll, Linea, ZKsync, Blast, Celo, Moonbeam, opBNB, Unichain, Ink, Sei, Berachain, ApeChain

**4 Covalent chains:** Taiko, Ronin, Moonriver, Viction

**Plus:** Solana, XRP Ledger

## Also Available As

- **MCP Server:** `npx -y mcp-server-insumer` ([npm](https://www.npmjs.com/package/mcp-server-insumer))
- **LangChain:** `pip install langchain-insumer` ([PyPI](https://pypi.org/project/langchain-insumer/))
- **OpenAI GPT:** [GPT Store](https://chatgpt.com/g/g-67bf98eb32dc8191a4051de54f7e2c6e-insumer-api-assistant)

## Links

- [API Documentation](https://insumermodel.com/developers/api-reference/)
- [OpenAPI Spec](https://insumermodel.com/openapi.yaml)
- [API Topology](https://insumermodel.com/workbench/)

## License

MIT
