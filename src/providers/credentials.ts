import type {
  Provider,
  IAgentRuntime,
  Memory,
} from "@elizaos/core";

// Wallet address patterns
const EVM_REGEX = /\b0x[a-fA-F0-9]{40}\b/g;
const SOLANA_REGEX = /\b[1-9A-HJ-NP-Za-km-z]{32,44}\b/g;
const XRPL_REGEX = /\br[1-9A-HJ-NP-Za-km-z]{24,34}\b/g;
const BITCOIN_REGEX = /\b(1[a-km-zA-HJ-NP-Z1-9]{25,34}|3[a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}|bc1p[a-z0-9]{58})\b/g;

// Common false positives for Solana regex (transaction hashes, etc.)
function isSolanaAddress(candidate: string): boolean {
  // Solana addresses are 32-44 chars of base58
  return candidate.length >= 32 && candidate.length <= 44;
}

export const walletCredentialsProvider: Provider = {
  name: "WALLET_CREDENTIALS",
  description:
    "Detects wallet addresses in conversation and signals that InsumerAPI verification actions are available.",
  dynamic: true,

  get: async (
    runtime: IAgentRuntime,
    message: Memory
  ) => {
    // Silent if no API key configured
    const apiKey = runtime.getSetting("INSUMER_API_KEY");
    if (!apiKey || typeof apiKey !== "string" || !apiKey.startsWith("insr_live_")) {
      return { text: "" };
    }

    const text = message.content.text || "";

    const evmWallets = text.match(EVM_REGEX) || [];
    const solanaMatches = (text.match(SOLANA_REGEX) || []).filter(isSolanaAddress);
    const xrplWallets = text.match(XRPL_REGEX) || [];
    const bitcoinWallets = text.match(BITCOIN_REGEX) || [];

    // Filter Solana matches that overlap with EVM, XRPL, or Bitcoin
    const evmSet = new Set(evmWallets);
    const xrplSet = new Set(xrplWallets);
    const btcSet = new Set(bitcoinWallets);
    const solanaWallets = solanaMatches.filter(
      (s) => !evmSet.has(s) && !xrplSet.has(s) && !btcSet.has(s)
    );

    const detected: string[] = [];
    if (evmWallets.length > 0) {
      detected.push(`EVM: ${evmWallets.join(", ")}`);
    }
    if (solanaWallets.length > 0) {
      detected.push(`Solana: ${solanaWallets.join(", ")}`);
    }
    if (xrplWallets.length > 0) {
      detected.push(`XRPL: ${xrplWallets.join(", ")}`);
    }
    if (bitcoinWallets.length > 0) {
      detected.push(`Bitcoin: ${bitcoinWallets.join(", ")}`);
    }

    if (detected.length === 0) {
      return { text: "" };
    }

    return {
      text: `InsumerAPI is available for on-chain verification. Detected wallets: ${detected.join("; ")}. You can use VERIFY_WALLET to check token balances/NFTs/attestations, or CHECK_TRUST for a full trust profile.`,
    };
  },
};
