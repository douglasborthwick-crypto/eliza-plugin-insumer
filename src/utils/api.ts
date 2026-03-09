const API_BASE = "https://api.insumermodel.com/v1";

// --- Types ---

export interface ApiResponse {
  ok: boolean;
  data?: Record<string, unknown>;
  error?: { code: number; message: string };
  meta?: { version: string; timestamp: string };
}

export interface AttestCondition {
  type: "token_balance" | "nft_ownership" | "eas_attestation" | "farcaster_id";
  contractAddress?: string;
  chainId?: number | "solana" | "xrpl";
  threshold?: number;
  decimals?: number;
  currency?: string;
  taxon?: number;
  label?: string;
  schemaId?: string;
  attester?: string;
  indexer?: string;
  template?: string;
}

export interface AttestParams {
  wallet?: string;
  solanaWallet?: string;
  xrplWallet?: string;
  proof?: "merkle";
  format?: "jwt";
  conditions: AttestCondition[];
}

export interface TrustParams {
  wallet: string;
  solanaWallet?: string;
  xrplWallet?: string;
  proof?: "merkle";
}

export interface BatchTrustParams {
  wallets: Array<{
    wallet: string;
    solanaWallet?: string;
    xrplWallet?: string;
  }>;
  proof?: "merkle";
}

// --- API helper ---

export async function apiCall(
  apiKey: string,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<ApiResponse> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json() as Promise<ApiResponse>;
}

// --- Response formatters ---

interface AttestResult {
  condition: number;
  label?: string;
  type: string;
  chainId?: number | string;
  met: boolean;
  blockNumber?: string;
  blockTimestamp?: string;
  ledgerIndex?: number;
  ledgerHash?: string;
  trustLineState?: { frozen: boolean };
}

interface TrustDimension {
  checks: Array<{ label: string; met: boolean }>;
  passCount: number;
  failCount: number;
  total: number;
}

/**
 * Format an attest API response for display.
 * API shape: data = { attestation: { id, pass, results, passCount, failCount, expiresAt }, sig, kid, jwt? }
 */
export function formatAttestResult(data: Record<string, unknown>): string {
  const attestation = data.attestation as Record<string, unknown> | undefined;
  const id = attestation?.id as string;
  const pass = attestation?.pass as boolean;
  const results = (attestation?.results || []) as AttestResult[];
  const lines: string[] = [
    `Attestation ${id}: ${pass ? "PASS" : "FAIL"}`,
    "",
  ];
  for (const r of results) {
    const icon = r.met ? "+" : "-";
    const chain =
      r.chainId !== undefined ? ` (chain ${r.chainId})` : "";
    let extra = "";
    if (r.ledgerIndex !== undefined) {
      extra += ` | ledger ${r.ledgerIndex}`;
    }
    if (r.trustLineState?.frozen) {
      extra += " | FROZEN trust line";
    }
    lines.push(`  [${icon}] ${r.label || r.type}${chain}${extra}`);
  }
  const passCount = attestation?.passCount as number;
  const failCount = attestation?.failCount as number;
  lines.push("", `${passCount} passed, ${failCount} failed`);
  if (attestation?.expiresAt) {
    lines.push(`Expires: ${attestation.expiresAt}`);
  }
  if (data.jwt) {
    lines.push("", `JWT: ${data.jwt}`);
  }
  return lines.join("\n");
}

/**
 * Format a trust API response for display.
 * API shape: data = { trust: { id, dimensions, summary, ... }, sig, kid }
 */
export function formatTrustResult(data: Record<string, unknown>): string {
  const trust = data.trust as Record<string, unknown> | undefined;
  const id = trust?.id as string;
  const dimensions = trust?.dimensions as Record<string, TrustDimension> | undefined;
  const summary = trust?.summary as Record<string, unknown> | undefined;
  const lines: string[] = [`Trust Profile ${id}`, ""];
  if (dimensions) {
    for (const [name, dim] of Object.entries(dimensions)) {
      lines.push(
        `  ${name}: ${dim.passCount}/${dim.total} passed`
      );
      for (const check of dim.checks) {
        const icon = check.met ? "+" : "-";
        lines.push(`    [${icon}] ${check.label}`);
      }
    }
  }
  if (summary) {
    lines.push(
      "",
      `Overall: ${summary.totalPassed}/${summary.totalChecks} checks passed`
    );
  }
  return lines.join("\n");
}

/**
 * Format a batch trust API response for display.
 * API shape: data = { results: [{ trust: { id, wallet, summary, ... }, sig, kid } | { error: { wallet, message } }], summary: { requested, succeeded, failed } }
 */
export function formatBatchResult(data: Record<string, unknown>): string {
  const results = (data.results || []) as Array<Record<string, unknown>>;
  const batchSummary = data.summary as Record<string, unknown> | undefined;
  const lines: string[] = [`Batch Trust: ${results.length} profiles`, ""];
  for (const result of results) {
    if (result.error) {
      const err = result.error as Record<string, unknown>;
      lines.push(`  ${err.wallet}: ERROR — ${err.message}`);
    } else {
      const trust = result.trust as Record<string, unknown> | undefined;
      const summary = trust?.summary as Record<string, unknown> | undefined;
      lines.push(
        `  ${trust?.wallet}: ${summary?.totalPassed ?? "?"}/${summary?.totalChecks ?? "?"} checks passed (${trust?.id})`
      );
    }
  }
  if (batchSummary) {
    lines.push("", `${batchSummary.succeeded}/${batchSummary.requested} succeeded`);
  }
  return lines.join("\n");
}
