# eliza-plugin-insumer

ElizaOS plugin for [InsumerAPI](https://insumermodel.com) — 10 actions covering the full autonomous agent lifecycle for token-gated commerce across 32 blockchains.

An agent can go from zero to running a token-gated commerce operation with no human involvement: provision an API key with USDC, create a merchant, configure which tokens gate access, add credits, verify wallets, run ACP/UCP commerce flows, and confirm payments — all autonomously.

## Install

```bash
npm install eliza-plugin-insumer
```

## Configure

### 1. Get a free API key (instant, no credit card)

Generate one from your terminal — no browser needed:

```bash
curl -s -X POST https://api.insumermodel.com/v1/keys/create \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "appName": "ElizaOS Agent", "tier": "free"}' | jq .
```

Returns an `insr_live_...` key with 10 credits and 100 calls/day. One free key per email.

Or visit [insumermodel.com/developers](https://insumermodel.com/developers/) to get one.

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

## Full Autonomous Flow

The 10 actions cover the complete agent lifecycle — no human required at any step:

```
BUY_API_KEY          → Provision API key with USDC (no auth needed)
CREATE_MERCHANT      → Create merchant profile (100 free credits)
CONFIGURE_TOKENS     → Set which tokens gate discounts + tier thresholds
ADD_CREDITS          → Top up merchant credits with USDC
VERIFY_WALLET        → Verify token/NFT/attestation conditions (1-10 per call)
CHECK_TRUST          → Generate 17-check wallet trust profile
CHECK_TRUST_BATCH    → Profile up to 10 wallets in one call
ACP_DISCOUNT         → Check discount in OpenAI/Stripe ACP format
UCP_DISCOUNT         → Check discount in Google UCP format
CONFIRM_PAYMENT      → Confirm on-chain USDC payment for discount code
```

## Actions

### BUY_API_KEY

Buy a new InsumerAPI key with USDC. No existing API key required — the sender wallet from the USDC transaction becomes the key's identity. One key per wallet.

```
User: "I sent 10 USDC on Base, tx 0xabc123. Create an API key called TrustBot."
Agent: [calls BUY_API_KEY → POST /v1/keys/buy]

API key created successfully!
Key: insr_live_...
Name: TrustBot
Credits: 250
Wallet: 0x...
```

### CREATE_MERCHANT

Create a new merchant. The agent's API key owns the merchant. Receives 100 free verification credits.

```
User: "Create a merchant called Acme Coffee with ID acme-coffee in New York."
Agent: [calls CREATE_MERCHANT → POST /v1/merchants]

Merchant created successfully!
ID: acme-coffee
Name: Acme Coffee
Credits: 100 (free starter credits)
```

### CONFIGURE_TOKENS

Configure which tokens gate access to merchant discounts. Up to 8 tokens with 1-4 discount tiers each. Limited to 11 onboarding chains.

```
User: "Set up USDC gating for acme-coffee: Bronze at 100 (5%), Silver at 1000 (10%), Gold at 10000 (15%) on Ethereum."
Agent: [calls CONFIGURE_TOKENS → PUT /v1/merchants/{id}/tokens]

Token tiers configured for acme-coffee!
Total tokens: 1/8
```

### ADD_CREDITS

Buy merchant verification credits with USDC. Credits are consumed by discount code generation.

```
User: "I sent 20 USDC on Base (tx 0xabc123) to top up credits for acme-coffee."
Agent: [calls ADD_CREDITS → POST /v1/merchants/{id}/credits]

Credits added to acme-coffee!
Credits added: 500
Total credits: 600
USDC paid: 20
Chain: Base
```

### VERIFY_WALLET

Verify 1-10 on-chain conditions (token balances, NFT ownership, EAS attestations, Farcaster identity) across 32 chains. Returns ECDSA-signed boolean results.

```
User: "Check if 0xd8dA... holds at least 100 UNI"
Agent: [calls VERIFY_WALLET → POST /v1/attest]

Attestation ATST-A7C3E: PASS
  [+] UNI balance >= 100 (chain 1)
1 passed, 0 failed
```

### CHECK_TRUST

Generate a structured wallet trust profile with 17+ checks across stablecoins, governance tokens, NFTs, and staking. Optional cross-chain with Solana and XRPL wallets.

```
User: "What's the trust profile for 0xd8dA...?"
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

```
User: "Check trust for these wallets: 0xd8dA..., 0xAb58..., 0x1234..."
Agent: [calls CHECK_TRUST_BATCH → POST /v1/trust/batch]

Batch Trust: 3 profiles
  0xd8dA...: 10/17 checks passed (TRST-B2K4F)
  0xAb58...: 7/17 checks passed (TRST-C3L5G)
  0x1234...: 3/17 checks passed (TRST-D4M6H)
```

### ACP_DISCOUNT

Check discount eligibility in OpenAI/Stripe Agentic Commerce Protocol format. Returns coupon objects, allocations, and a signed verification code. Costs 1 merchant credit.

```
User: "Check ACP discount for 0xd8dA... at merchant acme-coffee."
Agent: [calls ACP_DISCOUNT → POST /v1/acp/discount]

ACP Discount Result
Verification code: INSR-A7K3M
Discount: 10%
```

### UCP_DISCOUNT

Check discount eligibility in Google Universal Commerce Protocol format. Returns title-based discounts and a signed verification code. Costs 1 merchant credit.

```
User: "Check UCP discount for 0xd8dA... at merchant acme-coffee."
Agent: [calls UCP_DISCOUNT → POST /v1/ucp/discount]

UCP Discount Result
Verification code: INSR-B8L4N
Discount: 10%
```

### CONFIRM_PAYMENT

Confirm that a USDC payment was made on-chain for a discount code. Verifies the transaction receipt to ensure USDC arrived at the merchant address.

```
User: "Confirm payment for code INSR-A7K3M. I sent 25 USDC on Base, tx 0xdef456."
Agent: [calls CONFIRM_PAYMENT → POST /v1/payment/confirm]

Payment confirmed!
Code: INSR-A7K3M
Amount verified: 25 USDC
Chain: Base
```

## Wallet Auth (JWT)

The VERIFY_WALLET action supports `format: "jwt"` when the user requests a JWT or bearer token. The response includes a standard ES256-signed JWT alongside the attestation, verifiable by any JWT library via the JWKS endpoint at `GET /v1/jwks`. Use this for direct API gateway integration (Kong, Nginx, Cloudflare Access, AWS API Gateway).

## Provider: WALLET_CREDENTIALS

Automatically detects wallet addresses (EVM, Solana, XRPL) in conversation and signals that verification actions are available. Dynamic — only activates when wallet patterns are found.

## Handling `rpc_failure` Errors

If the API cannot reach one or more data sources after retries, actions return `ok: false` with error code `rpc_failure`. No signature, no JWT, no credits charged. This is a retryable error — the agent should retry after 2-5 seconds.

**Important:** `rpc_failure` is NOT a verification failure. Do not treat it as `pass: false`. It means the data source was temporarily unavailable and the API refused to sign an unverified result.

## Supported Chains (32)

30 EVM chains + Solana + XRP Ledger. Includes Ethereum, Base, Polygon, Arbitrum, Optimism, BNB Chain, Avalanche, and 23 more. [Full list →](https://insumermodel.com/developers/api-reference/)

## Pricing

**Tiers:** Free (10 credits) | Pro $9/mo (10,000/day) | Enterprise $29/mo (100,000/day)

**USDC volume discounts:** $5–$99 = $0.04/call (25 credits/$1) · $100–$499 = $0.03 (33/$1, 25% off) · $500+ = $0.02 (50/$1, 50% off)

**Platform wallets (USDC only):**
- **EVM:** `0xAd982CB19aCCa2923Df8F687C0614a7700255a23`
- **Solana:** `6a1mLjefhvSJX1sEX8PTnionbE9DqoYjU6F6bNkT4Ydr`

**Supported USDC chains:** Ethereum, Base, Polygon, Arbitrum, Optimism, BNB Chain, Avalanche, Solana. USDC sent on unsupported chains cannot be recovered. All purchases are final and non-refundable. [Full pricing →](https://insumermodel.com/pricing/)

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
