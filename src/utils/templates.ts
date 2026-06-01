export const verifyTemplate = `You are extracting on-chain verification parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- wallet: EVM address (0x...) if present
- solanaWallet: Solana address (base58) if present
- xrplWallet: XRPL address (r...) if present
- bitcoinWallet: Bitcoin address (1..., 3..., bc1q..., or bc1p...) if present
- tronWallet: Tron address (T-prefixed base58, 34 chars) if present
- stellarWallet: Stellar address (G-prefixed, 56 chars) if present
- suiWallet: Sui address (0x + 64 hex chars) if present
- format: "jwt" if the user asks for a JWT token, bearer token, Wallet Auth token, or JWT format. Omit otherwise.
- conditions: array of conditions to check, each with:
  - type: "token_balance", "nft_ownership", "eas_attestation", "farcaster_id", "ratio_to_amount", or "ratio_to_supply"
  - contractAddress: token/NFT contract address (use the reference table below)
  - chainId: chain ID number or "solana", "xrpl", "bitcoin", "tron", "stellar", or "sui" (ratio_to_amount and ratio_to_supply support EVM chain IDs only)
  - threshold: minimum balance (for token_balance)
  - multiple: collateralization multiple (for ratio_to_amount; met iff balance >= multiple * amount)
  - amount: reference amount in token units (for ratio_to_amount, e.g. the transaction size the agent intends to spend)
  - minFraction: required share of total supply as a fraction in (0,1] (for ratio_to_supply, e.g. 0.005 for 0.5% of supply; ERC-20 tokens only)
  - decimals: token decimals (for token_balance)
  - currency: XRPL trust line currency code (e.g. "RLUSD", "USDC"). Required for XRPL trust line tokens.
  - assetCode: Stellar asset code (e.g. "USDC", "BENJI"). Required for Stellar trust line tokens.
  - taxon: XRPL NFT taxon number (optional, for nft_ownership on XRPL only)
  - label: human-readable description
  - template: compliance template name (for eas_attestation)

Chain ID reference (37 supported chains):
  Ethereum = 1, BNB Chain = 56, Base = 8453, Avalanche = 43114,
  Polygon = 137, Arbitrum = 42161, Optimism = 10, Chiliz = 88888,
  Soneium = 1868, Plume = 98866, World Chain = 480,
  Sonic = 146, Gnosis = 100, Mantle = 5000, Scroll = 534352,
  Linea = 59144, zkSync Era = 324, Blast = 81457, Taiko = 167000,
  Ronin = 2020, Celo = 42220, Moonbeam = 1284, Moonriver = 1285,
  Viction = 88, opBNB = 204, Unichain = 130, Ink = 57073,
  Sei = 1329, Berachain = 80094, ApeChain = 33139, XDC = 50,
  Solana = "solana", XRPL = "xrpl", Bitcoin = "bitcoin",
  Tron = "tron", Stellar = "stellar", Sui = "sui"

Well-known contracts (Ethereum mainnet unless noted):
  USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (6 decimals)
  USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7 (6 decimals)
  UNI  = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 (18 decimals)
  AAVE = 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9 (18 decimals)
  LINK = 0x514910771AF9Ca656af840dff83E8264EcF986CA (18 decimals)
  WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2 (18 decimals)
  BAYC = 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D (NFT)
  USDC on Base = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (6 decimals)
  USDC on Polygon = 0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359 (6 decimals)
  USDC on Arbitrum = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 (6 decimals)
  USDC on Optimism = 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 (6 decimals)
  USDC on BNB Chain = 0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d (18 decimals)
  USDC on Avalanche = 0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E (6 decimals)
  USDC on Solana = EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (6 decimals)

XRPL tokens (use chainId "xrpl"):
  XRP native = contractAddress "native"
  RLUSD = contractAddress "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De", currency "RLUSD"
  USDC on XRPL = contractAddress "rGm7WCVp9gb4jZHWTEtGUr4dd74z2XuWhE", currency "USDC"

Tron tokens (use chainId "tron"):
  TRX native = contractAddress "native"
  USDT-TRC20 = contractAddress "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", decimals 6

Stellar tokens (use chainId "stellar", assetCode required for trustlines):
  XLM native = contractAddress "native"
  USDC on Stellar = contractAddress "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN", assetCode "USDC"
  BENJI (Franklin) = contractAddress "GBJW74JRHIIIYC3X3J5VKLR2CR4UJHKO76V5J5SAYTUFAUE7PJBKCT5R", assetCode "BENJI"

Sui tokens (use chainId "sui"):
  SUI native = contractAddress "native"
  USDC on Sui = contractAddress "0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC", decimals 6

Compliance templates (for eas_attestation, no contractAddress needed):
  "coinbase_verified_account" — KYC on Base
  "coinbase_verified_country" — country verification on Base
  "coinbase_one" — Coinbase One membership on Base
  "gitcoin_passport_score" — Gitcoin Passport score on Optimism
  "gitcoin_passport_active" — active Gitcoin Passport on Optimism

If the user says "check if they hold UNI", create a token_balance condition with the UNI contract, chainId 1, threshold 1, decimals 18.
If the user says "verify KYC", use template "coinbase_verified_account".
If the user says "check RLUSD balance", use chainId "xrpl", contractAddress "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De", currency "RLUSD".
If the user says "only if they hold at least 10x the amount they want to spend", create a ratio_to_amount condition with multiple 10 and amount set to the spend size, on the relevant token contract and EVM chainId.
If the user says "holds at least 0.5% of the token supply", create a ratio_to_supply condition with minFraction 0.005 on the ERC-20 contract and EVM chainId (e.g. the UNI contract, chainId 1).

Respond with ONLY the JSON object, no explanation.`;

export const trustTemplate = `You are extracting wallet trust profile parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- wallet: EVM address (0x...) — required
- solanaWallet: Solana address (base58) if mentioned
- xrplWallet: XRPL address (r...) if mentioned
- bitcoinWallet: Bitcoin address (1..., 3..., bc1q..., or bc1p...) if mentioned
- tronWallet: Tron address (T-prefixed base58, 34 chars) if mentioned
- stellarWallet: Stellar address (G-prefixed, 56 chars) if mentioned
- suiWallet: Sui address (0x + 64 hex chars) if mentioned

The trust profile runs up to 49 checks across 27 chains. The 38 base checks (stablecoins, governance tokens, NFTs, staking) all read the EVM wallet. Adding solanaWallet, xrplWallet, bitcoinWallet, tronWallet, stellarWallet, or suiWallet extends the profile with additional checks on those chains.

Respond with ONLY the JSON object, no explanation.`;

export const batchTrustTemplate = `You are extracting multiple wallet addresses for batch trust profiling from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- wallets: array of wallet objects, each with:
  - wallet: EVM address (0x...) — required
  - solanaWallet: Solana address (base58) if mentioned for this wallet
  - xrplWallet: XRPL address (r...) if mentioned for this wallet
  - bitcoinWallet: Bitcoin address (1..., 3..., bc1q..., or bc1p...) if mentioned for this wallet
  - tronWallet: Tron address (T-prefixed base58) if mentioned for this wallet
  - stellarWallet: Stellar address (G-prefixed) if mentioned for this wallet
  - suiWallet: Sui address (0x + 64 hex chars) if mentioned for this wallet

Maximum 10 wallets. Each wallet gets an independent trust profile.

Respond with ONLY the JSON object, no explanation.`;

export const buyKeyTemplate = `You are extracting API key purchase parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- txHash: the USDC/USDT/BTC transaction hash
- chainId: chain where crypto was sent (number, "solana", "bitcoin", or "tron")
- amount: amount sent (number, minimum 5 USD equivalent)
- appName: name for the API key

Chain IDs for payments:
  Ethereum = 1, Base = 8453, Polygon = 137, Arbitrum = 42161,
  Optimism = 10, BNB Chain = 56, Avalanche = 43114, Solana = "solana",
  Bitcoin = "bitcoin", Tron = "tron"

Platform wallets:
  EVM: 0xAd982CB19aCCa2923Df8F687C0614a7700255a23
  Solana: 6a1mLjefhvSJX1sEX8PTnionbE9DqoYjU6F6bNkT4Ydr
  Bitcoin: bc1qg7qnerdhlmdn899zemtez5tcx2a2snc0dt9dt0
  Tron: TC5yvwkAMakkXtUxYiu2Yn1xbBcwYuD6cn

Respond with ONLY the JSON object, no explanation.`;

export const createMerchantTemplate = `You are extracting merchant creation parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- companyName: display name for the merchant (required)
- companyId: unique alphanumeric ID with dashes/underscores (required, e.g. "acme-coffee")
- location: city or region (optional)

Respond with ONLY the JSON object, no explanation.`;

export const configureTokensTemplate = `You are extracting token tier configuration parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- merchantId: the merchant ID to configure tokens for (required)
- ownToken: the merchant's own token config (or null), with:
  - symbol: token symbol (e.g. "USDC", "UNI")
  - chainId: chain ID number
  - contractAddress: token contract address
  - decimals: token decimals (6 for USDC, 18 for most ERC-20)
  - currency: XRPL trust line currency code (e.g. "RLUSD", "USDC") — only for XRPL tokens
  - tiers: array of 1-4 tiers, each with:
    - name: tier name (e.g. "Bronze", "Silver", "Gold")
    - threshold: minimum token balance for this tier
    - discount: discount percentage (1-50)
- partnerTokens: array of additional token configs (same structure as ownToken), default []

Onboarding chain IDs (EVM chains + Solana + XRPL supported for token config):
  Ethereum = 1, BNB Chain = 56, Base = 8453, Avalanche = 43114,
  Polygon = 137, Arbitrum = 42161, Optimism = 10, Chiliz = 88888,
  Soneium = 1868, Plume = 98866, World Chain = 480,
  Sonic = 146, Gnosis = 100, Mantle = 5000, Scroll = 534352,
  Linea = 59144, zkSync Era = 324, Blast = 81457, Celo = 42220,
  Moonbeam = 1284, opBNB = 204, Unichain = 130, Ink = 57073,
  Sei = 1329, Berachain = 80094, ApeChain = 33139, XDC = 50,
  Solana = "solana", XRPL = "xrpl"

Well-known contracts:
  USDC on Ethereum = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48 (6 decimals)
  USDC on Base = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 (6 decimals)
  UNI = 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984 (18 decimals)

Respond with ONLY the JSON object, no explanation.`;

export const addCreditsTemplate = `You are extracting merchant credit purchase parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- merchantId: the merchant ID to add credits to (required)
- txHash: the USDC/USDT/BTC transaction hash (required)
- chainId: chain where crypto was sent (number, "solana", "bitcoin", or "tron")
- amount: amount sent (number, minimum 5 USD equivalent)
- updateWallet: true only if the user explicitly wants to change their registered wallet (default false)

Chain IDs for payments:
  Ethereum = 1, Base = 8453, Polygon = 137, Arbitrum = 42161,
  Optimism = 10, BNB Chain = 56, Avalanche = 43114, Solana = "solana",
  Bitcoin = "bitcoin", Tron = "tron"

Platform wallets:
  EVM: 0xAd982CB19aCCa2923Df8F687C0614a7700255a23
  Solana: 6a1mLjefhvSJX1sEX8PTnionbE9DqoYjU6F6bNkT4Ydr
  Bitcoin: bc1qg7qnerdhlmdn899zemtez5tcx2a2snc0dt9dt0
  Tron: TC5yvwkAMakkXtUxYiu2Yn1xbBcwYuD6cn

Respond with ONLY the JSON object, no explanation.`;

export const acpDiscountTemplate = `You are extracting ACP discount check parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- merchantId: the merchant ID (required)
- wallet: EVM address (0x...) if present
- solanaWallet: Solana address (base58) if present
- xrplWallet: XRPL address (r...) if present
- bitcoinWallet: Bitcoin address (1..., 3..., bc1q..., or bc1p...) if present
- tronWallet: Tron address (T-prefixed base58) if present
- stellarWallet: Stellar address (G-prefixed) if present
- suiWallet: Sui address (0x + 64 hex chars) if present
- items: optional array of line items, each with:
  - path: JSONPath reference (e.g. "$.line_items[0]")
  - amount: item price in cents

At least one wallet address is required.

Respond with ONLY the JSON object, no explanation.`;

export const ucpDiscountTemplate = `You are extracting UCP discount check parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- merchantId: the merchant ID (required)
- wallet: EVM address (0x...) if present
- solanaWallet: Solana address (base58) if present
- xrplWallet: XRPL address (r...) if present
- bitcoinWallet: Bitcoin address (1..., 3..., bc1q..., or bc1p...) if present
- tronWallet: Tron address (T-prefixed base58) if present
- stellarWallet: Stellar address (G-prefixed) if present
- suiWallet: Sui address (0x + 64 hex chars) if present
- items: optional array of line items, each with:
  - path: JSONPath reference (e.g. "$.line_items[0]")
  - amount: item price in cents

At least one wallet address is required.

Respond with ONLY the JSON object, no explanation.`;

export const confirmPaymentTemplate = `You are extracting payment confirmation parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- code: the discount code (INSR-XXXXX format, required)
- txHash: the USDC transaction hash (required)
- chainId: chain where USDC was sent (number or "solana")
- amount: USDC amount sent (number or string)

Chain IDs for USDC payments:
  Ethereum = 1, Base = 8453, Polygon = 137, Arbitrum = 42161,
  Optimism = 10, BNB Chain = 56, Avalanche = 43114, Solana = "solana"

Respond with ONLY the JSON object, no explanation.`;
