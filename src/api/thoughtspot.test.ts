/**
 * Tests for the ThoughtSpot integration.
 * Run with: bun test src/api/thoughtspot.test.ts
 */

import { describe, it, expect } from "bun:test";
import {
  callThoughtSpotAPI,
  queryThoughtSpotLive,
} from "./thoughtspot";

describe("ThoughtSpot API client", () => {
  it("callThoughtSpotAPI handles invalid credentials", async () => {
    const result = await callThoughtSpotAPI(
      { apiEndpoint: "https://example.thoughtspot.cloud", apiToken: "invalid-token" },
      "/api/rest/2.0/searchdata"
    );
    // Should fail gracefully — network error or auth error
    expect(result.success).toBe(false);
  });

  it("callThoughtSpotAPI handles empty endpoint", async () => {
    const result = await callThoughtSpotAPI(
      { apiEndpoint: "", apiToken: "test" },
      "/api/rest/2.0/searchdata"
    );
    expect(result.success).toBe(false);
  });

  it("callThoughtSpotAPI handles network timeout", async () => {
    const result = await callThoughtSpotAPI(
      { apiEndpoint: "https://api.thoughtspot.com/v1", apiToken: "test" },
      "/api/rest/2.0/searchdata"
    );
    // Should fail gracefully — network error
    expect(result.success).toBe(false);
  });
});

describe("ThoughtSpot query mappings", () => {
  it("queryThoughtSpotLive rejects unknown query type", async () => {
    const result = await queryThoughtSpotLive(
      { apiEndpoint: "https://test.thoughtspot.cloud", apiToken: "test" },
      "unknown_query_type"
    );
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unknown query type");
  });

  it("queryThoughtSpotLive handles known query types gracefully", async () => {
    const types = ["sales_performance", "pipeline_metrics", "team_metrics", "skill_benchmarks"];
    for (const type of types) {
      const result = await queryThoughtSpotLive(
        { apiEndpoint: "https://test.thoughtspot.cloud", apiToken: "test" },
        type
      );
      // Each should fail with network error (not "unknown query type")
      expect(result.success).toBe(false);
      expect(result.error).not.toContain("Unknown query type");
    }
  });
});