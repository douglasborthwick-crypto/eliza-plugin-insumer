/**
 * Tests for VERIFY_WALLET action JWT format support and response formatting.
 *
 * Run: npx vitest run
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatAttestResult } from "../src/utils/api.js";
import type { AttestParams } from "../src/utils/api.js";

// --- formatAttestResult tests ---

describe("formatAttestResult", () => {
  it("formats standard attest response correctly", () => {
    const data = {
      attestation: {
        id: "ATST-A7C3E",
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
    expect(result).toContain("Attestation ATST-A7C3E: FAIL");
    expect(result).toContain("[+] USDC >= 1000 (chain 1)");
    expect(result).toContain("[-] Bored Ape holder (chain 1)");
    expect(result).toContain("1 passed, 1 failed");
    expect(result).toContain("Expires: 2026-03-04T12:30:00.000Z");
    expect(result).not.toContain("JWT:");
  });

  it("includes jwt field when present", () => {
    const data = {
      attestation: {
        id: "ATST-B8D4F",
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
    expect(result).toContain("Attestation ATST-B8D4F: PASS");
    expect(result).toContain("JWT: eyJhbGciOiJFUzI1NiJ9.eyJzdWIiOiIweDEyMzQifQ.dGVzdA");
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
