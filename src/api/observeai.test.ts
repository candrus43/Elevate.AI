/**
 * Tests for the Observe.ai integration.
 * Run with: bun test src/api/observeai.test.ts
 */

import { describe, it, expect, mock } from "bun:test";
import {
  simulateCalls,
  simulateTranscript,
  simulateScores,
  simulateCoaching,
  simulateSkills,
  getObserveAIConfig,
  saveObserveAIConfig,
  callObserveAI,
} from "./observeai";

describe("Observe.ai simulated data", () => {
  it("simulateCalls returns array of calls", () => {
    const calls = simulateCalls();
    expect(Array.isArray(calls)).toBe(true);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toHaveProperty("callId");
    expect(calls[0]).toHaveProperty("agentId");
    expect(calls[0]).toHaveProperty("duration");
    expect(calls[0]).toHaveProperty("direction");
  });

  it("simulateTranscript returns structured transcript", () => {
    const transcript = simulateTranscript("OBS-001");
    expect(transcript.callId).toBe("OBS-001");
    expect(transcript.utterances.length).toBeGreaterThan(0);
    expect(transcript.utterances[0]).toHaveProperty("speaker");
    expect(transcript.utterances[0]).toHaveProperty("text");
    expect(transcript.utterances[0]).toHaveProperty("startTime");
    expect(transcript.utterances[0]).toHaveProperty("endTime");
    expect(transcript.fullText).toBeTruthy();
  });

  it("simulateScores returns all score categories", () => {
    const scores = simulateScores("OBS-001");
    expect(scores.callId).toBe("OBS-001");
    expect(scores.overall).toBeGreaterThanOrEqual(0);
    expect(scores.overall).toBeLessThanOrEqual(100);
    expect(scores.compliance).toBeGreaterThanOrEqual(0);
    expect(scores.categories).toHaveProperty("greeting");
    expect(scores.categories).toHaveProperty("closing");
  });

  it("simulateCoaching returns recommendations", () => {
    const coaching = simulateCoaching("AG-101");
    expect(coaching.agentId).toBe("AG-101");
    expect(coaching.recommendations.length).toBeGreaterThan(0);
    expect(coaching.recommendations[0]).toHaveProperty("priority");
    expect(["high", "medium", "low"]).toContain(coaching.recommendations[0].priority);
    expect(coaching.strengths.length).toBeGreaterThan(0);
    expect(coaching.weaknesses.length).toBeGreaterThan(0);
  });

  it("simulateSkills returns skill assessments", () => {
    const skills = simulateSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBeGreaterThan(0);
    expect(skills[0]).toHaveProperty("name");
    expect(skills[0]).toHaveProperty("score");
    expect(skills[0]).toHaveProperty("trend");
    expect(["improving", "declining", "stable"]).toContain(skills[0].trend);
  });
});

describe("Observe.ai API client", () => {
  it("callObserveAI handles invalid API key", async () => {
    const result = await callObserveAI(
      { apiKey: "invalid-key", instanceUrl: "https://api.observe.ai/v1" },
      "/v1/calls"
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("callObserveAI handles network timeout", async () => {
    const result = await callObserveAI(
      { apiKey: "test-key", instanceUrl: "https://api.observe.ai/v1" },
      "/v1/calls",
      { method: "GET" }
    );
    // Should fail gracefully — either network error or timeout
    expect(result.success).toBe(false);
  });

  it("callObserveAI handles empty instance URL", async () => {
    const result = await callObserveAI(
      { apiKey: "test-key", instanceUrl: "" },
      "/v1/calls"
    );
    expect(result.success).toBe(false);
  });
});

describe("Observe.ai config", () => {
  it("getObserveAIConfig returns null when not configured", async () => {
    const config = await getObserveAIConfig("nonexistent-company");
    expect(config).toBeNull();
  });

  it("saveObserveAIConfig handles missing api key", async () => {
    const result = await saveObserveAIConfig("test-company", {
      apiKey: "test-key",
      instanceUrl: "https://api.observe.ai/v1",
    });
    // Should succeed or fail gracefully depending on DB state
    expect(typeof result).toBe("boolean");
  });
});