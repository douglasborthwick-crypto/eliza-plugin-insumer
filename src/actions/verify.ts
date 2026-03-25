import type {
  Action,
  ActionExample,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
} from "@elizaos/core";
import { apiCall, formatAttestResult } from "../utils/api.js";
import type { AttestParams } from "../utils/api.js";
import { verifyTemplate } from "../utils/templates.js";

export const verifyWalletAction: Action = {
  name: "VERIFY_WALLET",
  description:
    "Verify on-chain token balances, NFT ownership, EAS attestations, or Farcaster identity for a wallet across 33 blockchains. Returns ECDSA-signed privacy-preserving booleans — never exposes actual balances. Supports EVM, Solana, XRPL, and Bitcoin.",
  similes: [
    "CHECK_WALLET",
    "VERIFY_TOKENS",
    "CHECK_TOKEN_BALANCE",
    "VERIFY_NFT",
    "ATTEST_WALLET",
    "ON_CHAIN_VERIFY",
    "CHECK_HOLDINGS",
    "WALLET_ATTESTATION",
  ],
  examples: [
    [
      {
        name: "user",
        content: {
          text: "Can you check if 0x1234567890abcdef1234567890abcdef12345678 holds at least 100 UNI?",
        },
      } as ActionExample,
      {
        name: "assistant",
        content: {
          text: "I'll verify the UNI holdings for that wallet now.",
          actions: ["VERIFY_WALLET"],
        },
      } as ActionExample,
    ],
    [
      {
        name: "user",
        content: {
          text: "Verify if 6a1mLjefhvSJX1sEX8PTnionbE9DqoYjU6F6bNkT4Ydr has USDC on Solana",
        },
      } as ActionExample,
      {
        name: "assistant",
        content: {
          text: "Checking USDC balance on Solana for that wallet.",
          actions: ["VERIFY_WALLET"],
        },
      } as ActionExample,
    ],
    [
      {
        name: "user",
        content: {
          text: "Does 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 have a Coinbase KYC attestation?",
        },
      } as ActionExample,
      {
        name: "assistant",
        content: {
          text: "I'll check for a Coinbase verified account attestation on Base.",
          actions: ["VERIFY_WALLET"],
        },
      } as ActionExample,
    ],
    [
      {
        name: "user",
        content: {
          text: "Check if ra8xqX4QhcogFfxpMxMByvFnXyxw9E8rzY holds at least 10 RLUSD on XRPL",
        },
      } as ActionExample,
      {
        name: "assistant",
        content: {
          text: "I'll verify RLUSD holdings on XRP Ledger for that wallet.",
          actions: ["VERIFY_WALLET"],
        },
      } as ActionExample,
    ],
  ],

  validate: async (runtime: IAgentRuntime, _message: Memory): Promise<boolean> => {
    const apiKey = runtime.getSetting("INSUMER_API_KEY");
    return typeof apiKey === "string" && apiKey.startsWith("insr_live_");
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state?: State,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback
  ) => {
    const apiKey = runtime.getSetting("INSUMER_API_KEY") as string;

    // Build state if not provided
    if (!state) {
      state = await runtime.composeState(message, []);
    }

    // Build extraction prompt
    const prompt = verifyTemplate.replace(
      "{{recentMessages}}",
      state.text || message.content.text || ""
    );

    // Extract structured params via LLM
    const extracted = await runtime.useModel("TEXT_SMALL" as never, {
      prompt,
      stopSequences: [] as string[],
    } as never) as string;

    let params: AttestParams;
    try {
      params = JSON.parse(extracted);
    } catch {
      if (callback) {
        await callback({
          text: "I couldn't extract the verification parameters from the conversation. Please specify a wallet address and what to check (e.g., token balance, NFT ownership, KYC attestation).",
        });
      }
      return { success: false, text: "Failed to parse verification parameters" };
    }

    // Validate at least one wallet and one condition
    if (!params.wallet && !params.solanaWallet && !params.xrplWallet && !params.bitcoinWallet) {
      if (callback) {
        await callback({
          text: "Please provide a wallet address to verify (EVM 0x..., Solana base58, XRPL r-address, or Bitcoin bc1.../1.../3...).",
        });
      }
      return { success: false, text: "No wallet address provided" };
    }
    if (!params.conditions || params.conditions.length === 0) {
      if (callback) {
        await callback({
          text: "Please specify what to verify (e.g., token balance, NFT ownership, KYC attestation).",
        });
      }
      return { success: false, text: "No conditions provided" };
    }

    // Call InsumerAPI
    const result = await apiCall(apiKey, "POST", "/attest", params as unknown as Record<string, unknown>);

    if (!result.ok) {
      const errMsg = result.error?.message || "Unknown API error";
      if (callback) {
        await callback({ text: `Verification failed: ${errMsg}` });
      }
      return { success: false, text: errMsg };
    }

    const formatted = formatAttestResult(result.data!);
    if (callback) {
      await callback({ text: formatted });
    }
    return { success: true, text: formatted, data: result.data as Record<string, unknown> };
  },
};
