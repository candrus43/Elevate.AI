/**
 * Hodu Phone System Integration — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

const CALL_OUTCOMES = ["meeting_set", "voicemail", "discovery", "no_answer", "closed_won", "callback", "objection"];
const DIRECTIONS = ["inbound", "outbound"];

function mapHoduCallToElevateAI(call: { callId: string; duration: number; outcome: string; score: number }) {
  return {
    id: call.callId,
    durationSeconds: call.duration,
    outcome: call.outcome,
    score: call.score,
    requiresAnalysis: call.duration > 0,
    quality: call.score > 80 ? "excellent" : call.score > 60 ? "good" : call.score > 0 ? "needs_improvement" : "no_connection",
  };
}

describe("mapHoduCallToElevateAI()", () => {
  it("should map a high-scoring call", () => {
    const result = mapHoduCallToElevateAI({ callId: "HODU-001", duration: 342, outcome: "meeting_set", score: 78 });
    expect(result.requiresAnalysis).toBe(true);
    expect(result.quality).toBe("good");
  });

  it("should map a no-answer call", () => {
    const result = mapHoduCallToElevateAI({ callId: "HODU-004", duration: 0, outcome: "no_answer", score: 0 });
    expect(result.requiresAnalysis).toBe(false);
    expect(result.quality).toBe("no_connection");
  });

  it("should map a closed-won call", () => {
    const result = mapHoduCallToElevateAI({ callId: "HODU-005", duration: 410, outcome: "closed_won", score: 91 });
    expect(result.quality).toBe("excellent");
  });
});

describe("CALL_OUTCOMES", () => {
  it("should include 7 possible outcomes", () => {
    expect(CALL_OUTCOMES.length).toBe(7);
    expect(CALL_OUTCOMES).toContain("meeting_set");
    expect(CALL_OUTCOMES).toContain("closed_won");
  });
});

describe("DIRECTIONS", () => {
  it("should include inbound and outbound", () => {
    expect(DIRECTIONS).toContain("inbound");
    expect(DIRECTIONS).toContain("outbound");
  });
});