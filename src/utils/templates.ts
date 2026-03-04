export const verifyTemplate = `You are extracting on-chain verification parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- wallet: EVM address (0x...) if present
- solanaWallet: Solana address (base58) if present
- xrplWallet: XRPL address (r...) if present
- conditions: array of conditions to check, each with:
  - type: "token_balance", "nft_ownership", "eas_attestation", or "farcaster_id"
  - contractAddress: token/NFT contract address (use the reference table below)
  - chainId: chain ID number or "solana" or "xrpl"
  - threshold: minimum balance (for token_balance)
  - decimals: token decimals (for token_balance)
  - label: human-readable description
  - template: compliance template name (for eas_attestation)

Chain ID reference:
  Ethereum = 1, BNB Chain = 56, Base = 8453, Avalanche = 43114,
  Polygon = 137, Arbitrum = 42161, Optimism = 10, Chiliz = 88888,
  Soneium = 1868, Plume = 98866, World Chain = 480, Solana = "solana",
  XRPL = "xrpl"

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
  USDC on Solana = EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v (6 decimals)

XRPL tokens (use chainId "xrpl"):
  XRP native = contractAddress "native"
  RLUSD = contractAddress "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De", currency "RLUSD"
  USDC on XRPL = contractAddress "rcEGREd8NmkKRE8GE424sksyt1tJVFZwu", currency "USD"

Compliance templates (for eas_attestation, no contractAddress needed):
  "coinbase_verified_account" — KYC on Base
  "coinbase_verified_country" — country verification on Base
  "coinbase_one" — Coinbase One membership on Base
  "gitcoin_passport_score" — Gitcoin Passport score on Optimism
  "gitcoin_passport_active" — active Gitcoin Passport on Optimism

If the user says "check if they hold UNI", create a token_balance condition with the UNI contract, chainId 1, threshold 1, decimals 18.
If the user says "verify KYC", use template "coinbase_verified_account".
If the user says "check RLUSD balance", use chainId "xrpl", contractAddress "rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De", currency "RLUSD".

Respond with ONLY the JSON object, no explanation.`;

export const trustTemplate = `You are extracting wallet trust profile parameters from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- wallet: EVM address (0x...) — required
- solanaWallet: Solana address (base58) if mentioned
- xrplWallet: XRPL address (r...) if mentioned

The trust profile automatically checks 17+ dimensions (stablecoins, governance tokens, NFTs, staking) for the EVM wallet. Adding solanaWallet or xrplWallet extends the profile with additional checks.

Respond with ONLY the JSON object, no explanation.`;

export const batchTrustTemplate = `You are extracting multiple wallet addresses for batch trust profiling from the conversation.

Recent messages:
{{recentMessages}}

Extract the following as a JSON object:
- wallets: array of wallet objects, each with:
  - wallet: EVM address (0x...) — required
  - solanaWallet: Solana address (base58) if mentioned for this wallet
  - xrplWallet: XRPL address (r...) if mentioned for this wallet

Maximum 10 wallets. Each wallet gets an independent trust profile.

Respond with ONLY the JSON object, no explanation.`;
