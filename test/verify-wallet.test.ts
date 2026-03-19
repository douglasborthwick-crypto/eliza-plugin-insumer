/**
 * Tests for VERIFY_WALLET action JWT format support and response formatting.
 *
 * Run: npx vitest run
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatAttestResult, formatTrustResult, formatBatchResult } from "../src/utils/api.js";
import type { AttestParams } from "../src/utils/api.js";

// --- formatAttestResult tests ---

describe("formatAttestResult", () => {
  it("formats standard attest response correctly", () => {
    const data = {
      attestation: {
        id: "ATST-A7C3E1B2D4F56789",
        pass: false,
        results: [
          { condition: 0, label: "USDC >= 1000", type: "token_balance", chainId: 1, met: true },
          { condition: 1, label: "Bored Ape holder", type: "nft_ownership", chainId: 1, met: false },
        ],
        passCount: 1,
        failCount: 1,
        attestedAt: "2026-03-04T12:00:00.000Z",
        expiresAt: "2026-03-04T12:30:00.000Z",
      },
      sig: "base64sig...",
      kid: "insumer-attest-v1",
    };

    const result = formatAttestResult(data);
    expect(result).toContain("Attestation ATST-A7C3E1B2D4F56789: FAIL");
    expect(result).toContain("[+] USDC >= 1000 (chain 1)");
    expect(result).toContain("[-] Bored Ape holder (chain 1)");
    expect(result).toContain("1 passed, 1 failed");
    expect(result).toContain("Expires: 2026-03-04T12:30:00.000Z");
    expect(result).not.toContain("JWT:");
  });

  it("includes jwt field when present", () => {
    const data = {
      attestation: {
        id: "ATST-B8D4F6A7E9C01234",
        pass: true,
        results: [{ condition: 0, label: "Test", type: "token_balance", chainId: 1, met: true }],
        passCount: 1,
        failCount: 0,
        attestedAt: "2026-03-04T12:00:00.000Z",
        expiresAt: "2026-03-04T12:30:00.000Z",
      },
      sig: "base64sig...",
      kid: "insumer-attest-v1",
      jwt: "eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIweDEyMzQifQ.dGVzdA",
    };

    const result = formatAttestResult(data);
    expect(result).toContain("Attestation ATST-B8D4F6A7E9C01234: PASS");
    expect(result).toContain("JWT: eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIweDEyMzQifQ.dGVzdA");
  });
});

// --- formatTrustResult tests ---

describe("formatTrustResult", () => {
  it("formats trust response with correct nesting", () => {
    const data = {
      trust: {
        id: "TRST-12345",
        wallet: "0xabc",
        dimensions: {
          financial: {
            checks: [
              { label: "USDC balance", met: true },
              { label: "ETH balance", met: false },
            ],
            passCount: 1,
            failCount: 1,
            total: 2,
          },
        },
        summary: {
          totalChecks: 2,
          totalPassed: 1,
          totalFailed: 1,
        },
      },
      sig: "base64sig...",
      kid: "insumer-attest-v1",
    };

    const result = formatTrustResult(data);
    expect(result).toContain("Trust Profile TRST-12345");
    expect(result).toContain("financial: 1/2 passed");
    expect(result).toContain("[+] USDC balance");
    expect(result).toContain("[-] ETH balance");
    expect(result).toContain("Overall: 1/2 checks passed");
  });
});

// --- formatBatchResult tests ---

describe("formatBatchResult", () => {
  it("formats batch response with correct nesting", () => {
    const data = {
      results: [
        {
          trust: {
            id: "TRST-AAA",
            wallet: "0x111",
            summary: { totalChecks: 5, totalPassed: 3, totalFailed: 2 },
          },
          sig: "sig1",
          kid: "insumer-attest-v1",
        },
        {
          error: { wallet: "0x222", message: "Invalid address" },
        },
      ],
      summary: { requested: 2, succeeded: 1, failed: 1 },
    };

    const result = formatBatchResult(data);
    expect(result).toContain("Batch Trust: 2 profiles");
    expect(result).toContain("0x111: 3/5 checks passed (TRST-AAA)");
    expect(result).toContain("0x222: ERROR — Invalid address");
    expect(result).toContain("1/2 succeeded");
  });
});

// --- AttestParams type tests ---

describe("AttestParams", () => {
  it("accepts format: 'jwt'", () => {
    const params: AttestParams = {
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      format: "jwt",
      conditions: [
        { type: "token_balance", contractAddress: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", chainId: 1, threshold: 100, decimals: 6 },
      ],
    };
    expect(params.format).toBe("jwt");
  });

  it("format is optional (undefined by default)", () => {
    const params: AttestParams = {
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      conditions: [{ type: "token_balance", contractAddress: "0x...", chainId: 1, threshold: 1 }],
    };
    expect(params.format).toBeUndefined();
  });
});

// --- apiCall format passthrough test ---

describe("apiCall format passthrough", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("includes format in request body when set to jwt", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          ok: true,
          data: {
            attestation: { id: "ATST-TEST", pass: true, results: [], passCount: 0, failCount: 0 },
            sig: "sig",
            kid: "insumer-attest-v1",
            jwt: "eyJ.eyJ.sig",
          },
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { apiCall } = await import("../src/utils/api.js");
    await apiCall("insr_live_test", "POST", "/attest", {
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      format: "jwt",
      conditions: [{ type: "token_balance", contractAddress: "0x...", chainId: 1, threshold: 1 }],
    });

    expect(mockFetch).toHaveBeenCalledOnce();
    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.format).toBe("jwt");
  });

  it("does not include format when not set", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          ok: true,
          data: {
            attestation: { id: "ATST-TEST", pass: true, results: [], passCount: 0, failCount: 0 },
            sig: "sig",
            kid: "insumer-attest-v1",
          },
        }),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { apiCall } = await import("../src/utils/api.js");
    await apiCall("insr_live_test", "POST", "/attest", {
      wallet: "0x1234567890abcdef1234567890abcdef12345678",
      conditions: [{ type: "token_balance", contractAddress: "0x...", chainId: 1, threshold: 1 }],
    });

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.format).toBeUndefined();
  });
});
