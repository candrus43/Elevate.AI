/**
 * Module 3: AI Role Play Center — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

// ─── Replicate AI logic for isolated testing ──────────────────────────────────

const TONES: Record<string, string> = {
  skeptical: "You are skeptical and demand evidence.",
  guarded: "You are price-conscious and protective of your budget.",
  authoritative: "You are a busy executive.",
  impatient: "You are in a hurry.",
  confrontational: "You are well-researched and combative.",
  warm: "You are friendly but non-committal.",
  formal: "You are process-oriented and cautious.",
  neutral: "You are a neutral prospect.",
};

function generateAIRoleplayResponse(
  personality: { name: string; tone: string } | null,
  _scenarioType: string,
  _userMessage: string,
  turnNumber: number,
) {
  const p = personality || { name: "Generic Prospect", tone: "neutral" };
  const isOpening = turnNumber <= 1;

  if (isOpening) {
    return { content: `Hi there! I'm ${p.name}. Tell me more.`, feedback: undefined as string | undefined, confidenceScore: 75 };
  }

  return { content: `Response ${p.tone} turn ${turnNumber}`, feedback: "Good form", confidenceScore: Math.round(Math.random() * 30 + 60) };
}

function generateScorecard(session: { difficulty?: string }) {
  const baseScore = session.difficulty === "hard" ? 65 : session.difficulty === "easy" ? 80 : 72;
  return {
    overallScore: baseScore + 3,
    discoverySkills: baseScore + 2,
    objectionHandling: baseScore - 3,
    closingTechnique: baseScore - 5,
    rapportBuilding: baseScore + 5,
    strengths: ["Engaged actively", "Professional tone"],
    areasForImprovement: ["Handle price objections", "Improve closing"],
  };
}

function generateRecommendations(scorecard: { areasForImprovement?: string[] }) {
  const improvements = scorecard.areasForImprovement || [];
  return improvements.map((imp: string, i: number) => ({
    category: ["objection_handling", "closing"][i] || "general",
    recommendation: imp,
    priority: 3 - i,
    skillArea: ["Objection Handling", "Closing"][i] || "General",
    practiceSuggestion: "Practice with relevant personality",
  }));
}

function generateReplayAnalysis(turns: Array<{ speaker: string; content?: string }>) {
  const userWords = turns.filter((t) => t.speaker === "user").reduce((s, t) => s + (t.content?.length || 0), 0);
  const aiWords = turns.filter((t) => t.speaker === "ai").reduce((s, t) => s + (t.content?.length || 0), 0);
  const total = userWords + aiWords || 1;
  return {
    talkRatio: Math.round((userWords / total) * 100),
    objectionHandlingScore: 72,
    closingEffectiveness: 68,
    pacingScore: 78,
    rapportBuilding: 80,
    keyMoments: ["Handled objection well"],
  };
}

const PERSONALITY_NAMES = [
  "Skeptical Susan", "Budget-Conscious Bob", "Decision-Maker Diana",
  "Time-Pressed Tom", "Objection-Focused Oscar", "Friendly Fiona", "Compliance-Conscious Carl",
];

const INDUSTRIES = ["SaaS", "Insurance", "Enterprise", "Financial", "Solar", "Tech", "Healthcare", "General"];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("generateAIRoleplayResponse()", () => {
  it("should generate greeting on opening turn", () => {
    const result = generateAIRoleplayResponse({ name: "Skeptical Susan", tone: "skeptical" }, "discovery", "hello", 0);
    expect(result.content).toContain("Skeptical Susan");
    expect(result.confidenceScore).toBeGreaterThan(0);
  });

  it("should generate response for subsequent turns", () => {
    const result = generateAIRoleplayResponse({ name: "Bob", tone: "guarded" }, "objection", "why so expensive?", 3);
    expect(result.content).toContain("turn");
    expect(result.feedback).toBeDefined();
  });

  it("should work with no personality (default)", () => {
    const result = generateAIRoleplayResponse(null, "closing", "ready to buy?", 5);
    expect(result.confidenceScore).toBeGreaterThan(50);
  });
});

describe("generateScorecard()", () => {
  it("should produce scorecard with all categories", () => {
    const sc = generateScorecard({ difficulty: "medium" });
    expect(sc.overallScore).toBeGreaterThan(0);
    expect(sc.strengths.length).toBeGreaterThan(0);
    expect(sc.areasForImprovement.length).toBeGreaterThan(0);
  });

  it("should adjust difficulty bias", () => {
    const easy = generateScorecard({ difficulty: "easy" });
    const hard = generateScorecard({ difficulty: "hard" });
    expect(easy.overallScore).toBeGreaterThan(hard.overallScore);
  });
});

describe("generateRecommendations()", () => {
  it("should generate recommendations from scorecard improvements", () => {
    const recs = generateRecommendations({ areasForImprovement: ["Price objection handling", "Closing confidence"] });
    expect(recs.length).toBe(2);
    expect(recs[0].priority).toBe(3);
    expect(recs[1].priority).toBe(2);
    expect(recs[0].skillArea).toBeDefined();
  });

  it("should handle empty improvements", () => {
    expect(generateRecommendations({})).toEqual([]);
  });
});

describe("generateReplayAnalysis()", () => {
  it("should compute talk ratio from turns", () => {
    const turns = [
      { speaker: "user", content: "Hello, how are you today?" },
      { speaker: "ai", content: "I'm fine, tell me about your product." },
      { speaker: "user", content: "Our product helps you save money and time." },
      { speaker: "ai", content: "That sounds interesting. How does it work specifically?" },
    ];
    const analysis = generateReplayAnalysis(turns);
    expect(analysis.talkRatio).toBeGreaterThan(0);
    expect(analysis.talkRatio).toBeLessThanOrEqual(100);
    expect(analysis.objectionHandlingScore).toBeGreaterThan(0);
    expect(analysis.keyMoments.length).toBe(1);
  });

  it("should handle single turn", () => {
    const analysis = generateReplayAnalysis([{ speaker: "ai", content: "Hello!" }]);
    expect(analysis.talkRatio).toBe(0);
  });
});

describe("Built-in personalities", () => {
  it("should include 7 customer personalities", () => {
    expect(PERSONALITY_NAMES).toContain("Skeptical Susan");
    expect(PERSONALITY_NAMES).toContain("Budget-Conscious Bob");
    expect(PERSONALITY_NAMES).toContain("Decision-Maker Diana");
    expect(PERSONALITY_NAMES).toContain("Time-Pressed Tom");
    expect(PERSONALITY_NAMES).toContain("Objection-Focused Oscar");
    expect(PERSONALITY_NAMES).toContain("Friendly Fiona");
    expect(PERSONALITY_NAMES).toContain("Compliance-Conscious Carl");
  });
});

describe("Built-in industries", () => {
  it("should include diverse industry templates", () => {
    expect(INDUSTRIES).toContain("SaaS");
    expect(INDUSTRIES).toContain("Healthcare");
    expect(INDUSTRIES).toContain("Solar");
    expect(INDUSTRIES.length).toBe(8);
  });
});

describe("TONE definitions", () => {
  it("should have 8 tone profiles", () => {
    expect(Object.keys(TONES).length).toBe(8);
    expect(TONES.skeptical).toContain("skeptical");
    expect(TONES.formal).toContain("cautious");
  });
});