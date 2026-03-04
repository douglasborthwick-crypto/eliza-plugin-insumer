import type { Plugin } from "@elizaos/core";
import { verifyWalletAction } from "./actions/verify.js";
import { checkTrustAction } from "./actions/trust.js";
import { checkTrustBatchAction } from "./actions/batch.js";
import { walletCredentialsProvider } from "./providers/credentials.js";

export const insumerPlugin: Plugin = {
  name: "insumer",
  description:
    "Privacy-preserving on-chain verification across 32 blockchains. Verify token balances, NFT ownership, EAS attestations, and wallet trust profiles — all with ECDSA-signed results that never expose actual balances.",
  actions: [verifyWalletAction, checkTrustAction, checkTrustBatchAction],
  providers: [walletCredentialsProvider],
};

export default insumerPlugin;
