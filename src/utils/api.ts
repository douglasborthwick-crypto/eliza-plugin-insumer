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
}

interface TrustDimension {
  checks: Array<{ label: string; met: boolean }>;
  passCount: number;
  failCount: number;
  total: number;
}

export function formatAttestResult(data: Record<string, unknown>): string {
  const id = data.id as string;
  const pass = data.pass as boolean;
  const results = (data.results || []) as AttestResult[];
  const lines: string[] = [
    `Attestation ${id}: ${pass ? "PASS" : "FAIL"}`,
    "",
  ];
  for (const r of results) {
    const icon = r.met ? "+" : "-";
    const chain =
      r.chainId !== undefined ? ` (chain ${r.chainId})` : "";
    lines.push(`  [${icon}] ${r.label || r.type}${chain}`);
  }
  const passCount = data.passCount as number;
  const failCount = data.failCount as number;
  lines.push("", `${passCount} passed, ${failCount} failed`);
  if (data.expiresAt) {
    lines.push(`Expires: ${data.expiresAt}`);
  }
  return lines.join("\n");
}

export function formatTrustResult(data: Record<string, unknown>): string {
  const id = data.id as string;
  const dimensions = data.dimensions as Record<string, TrustDimension> | undefined;
  const summary = data.summary as Record<string, unknown> | undefined;
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
      `Overall: ${summary.passCount}/${summary.totalChecks} checks passed`
    );
  }
  return lines.join("\n");
}

export function formatBatchResult(data: Record<string, unknown>): string {
  const profiles = (data.profiles || []) as Array<Record<string, unknown>>;
  const lines: string[] = [`Batch Trust: ${profiles.length} profiles`, ""];
  for (const profile of profiles) {
    if (profile.error) {
      lines.push(`  ${profile.wallet}: ERROR — ${profile.error}`);
    } else {
      const summary = profile.summary as Record<string, unknown> | undefined;
      lines.push(
        `  ${profile.wallet}: ${summary?.passCount ?? "?"}/${summary?.totalChecks ?? "?"} checks passed (${profile.id})`
      );
    }
  }
  return lines.join("\n");
}
