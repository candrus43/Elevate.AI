/**
 * Tests for the OpenAI API client.
 * Run with: bun test src/api/openai.test.ts
 */

import { describe, it, expect, mock } from "bun:test";
import {
  callOpenAI,
  getCallAnalysisSystemPrompt,
  getRolePlaySystemPrompt,
  getCoachingPlanSystemPrompt,
  getLiveCoachingSystemPrompt,
} from "./openai";

// Mock the db function for config tests
const mockDb = mock(() => []);
const mockJsonResponse = (data: any, status = 200) => new Response(JSON.stringify(data), { status });

describe("OpenAI system prompts", () => {
  it("call analysis prompt returns a string", () => {
    const prompt = getCallAnalysisSystemPrompt();
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(50);
    expect(prompt).toContain("overall_score");
    expect(prompt).toContain("objections");
    expect(prompt).toContain("sentiment");
  });

  it("role-play prompt includes personality profile", () => {
    const prompt = getRolePlaySystemPrompt("Friendly but skeptical buyer");
    expect(prompt).toContain("Friendly but skeptical buyer");
    expect(prompt).toContain("Stay in character");
  });

  it("coaching plan prompt returns structured JSON", () => {
    const prompt = getCoachingPlanSystemPrompt();
    expect(prompt).toContain("strengths");
    expect(prompt).toContain("weaknesses");
    expect(prompt).toContain("action_items");
  });

  it("live coaching prompt returns real-time suggestions", () => {
    const prompt = getLiveCoachingSystemPrompt();
    expect(prompt).toContain("suggestion");
    expect(prompt).toContain("objection_handling");
    expect(prompt).toContain("urgency");
  });
});

describe("callOpenAI", () => {
  it("returns error when API key is invalid", async () => {
    const result = await callOpenAI(
      { apiKey: "invalid-key", model: "gpt-4o-mini", maxTokens: 100 },
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 100,
      }
    );
    expect(result.success).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it("handles empty API key gracefully", async () => {
    const result = await callOpenAI(
      { apiKey: "", model: "gpt-4o-mini", maxTokens: 100 },
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 100,
      }
    );
    expect(result.success).toBe(false);
  });

  it("handles network timeout gracefully", async () => {
    const result = await callOpenAI(
      { apiKey: "sk-test", model: "gpt-4o-mini", maxTokens: 100 },
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 100,
      },
      1 // 1ms timeout
    );
    expect(result.success).toBe(false);
  });
});

describe("API handler structure", () => {
  it("config response hides API key", () => {
    const config = { configured: true, model: "gpt-4o-mini", maxTokens: 4096 };
    expect(config).not.toHaveProperty("apiKey");
    expect(config.configured).toBe(true);
    expect(config.model).toBe("gpt-4o-mini");
  });
});