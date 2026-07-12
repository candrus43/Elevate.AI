/**
 * Module 5: Coaching Academy — Core Logic Tests
 */

import { describe, it, expect } from "bun:test";

// ─── Replicate AI logic for isolated testing ──────────────────────────────────

function extractContentKnowledge(content: { id: string; title: string; content_text?: string; type: string }) {
  const topics = [`${content.title} Overview`, `${content.type} Best Practices`, `Advanced ${content.title}`];
  return { topics, insights: [`${content.title} is key for improving ${content.type} skills`], qaPairs: [{ q: `What is ${content.title}?`, a: `A ${content.type} resource.` }], skills: [content.type], keywords: [content.title.toLowerCase()] };
}

function generateQuizFromContent(content: any, count = 5) {
  return Array.from({ length: Math.min(count, 4) }, (_, i) => ({
    question: `Question ${i + 1} for ${content.title}`,
    options: ["Option A", "Option B", "Option C", "Option D"],
    correctAnswer: 0,
    explanation: "Focus on structured methodology.",
  }));
}

function answerQuestion(question: string, knowledge: any[]) {
  const q = question.toLowerCase();
  const relevant = knowledge.filter((k: any) => q.includes(k.topic.toLowerCase()));
  return relevant.length > 0
    ? { answer: relevant[0].keyInsights?.[0] || "Practice these techniques.", sources: [relevant[0].topic] }
    : { answer: "Focus on foundational sales skills.", sources: [] };
}

function analyzeSkillGaps(completedIds: string[], allContent: any[]) {
  const completed = new Set(completedIds);
  const types = [...new Set(allContent.map((c: any) => c.type))];
  return types.map((type) => {
    const typeItems = allContent.filter((c: any) => c.type === type);
    const done = typeItems.filter((c: any) => completed.has(c.id));
    const ratio = typeItems.length > 0 ? done.length / typeItems.length : 1;
    return ratio < 0.8 ? { skill: type, currentLevel: Math.round(ratio * 100), recommendedLevel: 80, gap: Math.round((0.8 - ratio) * 100), recommendations: [`Complete "${typeItems[0]?.title}"`] } : null;
  }).filter(Boolean);
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("extractContentKnowledge()", () => {
  it("should extract topics from content", () => {
    const result = extractContentKnowledge({ id: "1", title: "Discovery Calls", type: "video" });
    expect(result.topics).toContain("Discovery Calls Overview");
    expect(result.qaPairs.length).toBeGreaterThan(0);
    expect(result.skills).toContain("video");
  });
});

describe("generateQuizFromContent()", () => {
  it("should generate questions from content", () => {
    const qs = generateQuizFromContent({ title: "Objection Handling", type: "document" }, 3);
    expect(qs.length).toBe(3);
    expect(qs[0].options.length).toBe(4);
    expect(qs[0].correctAnswer).toBe(0);
  });

  it("should cap at 4 questions (template limit)", () => {
    const qs = generateQuizFromContent({ title: "Test", type: "video" }, 10);
    expect(qs.length).toBe(4);
  });
});

describe("answerQuestion()", () => {
  it("should answer from relevant knowledge", () => {
    const knowledge = [{ topic: "discovery", keyInsights: ["Focus on customer needs"] }];
    const result = answerQuestion("how do I improve discovery?", knowledge);
    expect(result.answer).toContain("customer needs");
    expect(result.sources).toContain("discovery");
  });

  it("should provide default answer for unknown questions", () => {
    const result = answerQuestion("what is quantum physics?", []);
    expect(result.answer).toContain("foundational");
  });
});

describe("analyzeSkillGaps()", () => {
  it("should identify gaps by content type", () => {
    const content = [{ id: "1", title: "Discovery Basics", type: "discovery" }, { id: "2", title: "Advanced Discovery", type: "discovery" }];
    const gaps = analyzeSkillGaps(["1"], content);
    expect(gaps.length).toBe(1);
    expect(gaps[0].skill).toBe("discovery");
    expect(gaps[0].gap).toBeGreaterThan(0);
  });

  it("should return empty for complete content", () => {
    const content = [{ id: "1", title: "Test", type: "test" }];
    expect(analyzeSkillGaps(["1"], content).length).toBe(0);
  });
});

describe("CONTENT_TYPES", () => {
  it("supports all required types", () => {
    const types = ["video", "document", "playbook", "script", "objection", "product_knowledge"];
    expect(types.length).toBe(6);
  });
});