import type { Plugin } from "@elizaos/core";
import { verifyWalletAction } from "./actions/verify.js";
import { checkTrustAction } from "./actions/trust.js";
import { checkTrustBatchAction } from "./actions/batch.js";
import { buyKeyAction } from "./actions/buy_key.js";
import { createMerchantAction } from "./actions/create_merchant.js";
import { configureTokensAction } from "./actions/configure_tokens.js";
import { addCreditsAction } from "./actions/add_credits.js";
import { acpDiscountAction } from "./actions/acp_discount.js";
import { ucpDiscountAction } from "./actions/ucp_discount.js";
import { confirmPaymentAction } from "./actions/confirm_payment.js";
import { walletCredentialsProvider } from "./providers/credentials.js";

export const insumerPlugin: Plugin = {
  name: "insumer",
  description:
    "Full autonomous agent lifecycle for token-gated commerce across 32 blockchains. 10 actions: buy API key, create merchant, configure token tiers, add credits, verify wallets, trust profiles, ACP/UCP commerce, confirm payments. ECDSA-signed results, never exposes balances.",
  actions: [
    verifyWalletAction,
    checkTrustAction,
    checkTrustBatchAction,
    buyKeyAction,
    createMerchantAction,
    configureTokensAction,
    addCreditsAction,
    acpDiscountAction,
    ucpDiscountAction,
    confirmPaymentAction,
  ],
  providers: [walletCredentialsProvider],
};

export default insumerPlugin;
