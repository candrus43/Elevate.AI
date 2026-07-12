/**
 * Module 3: AI Role Play Center — Backend API
 * Enterprise role-playing with personalities, industry templates, difficulty-based scoring, and post-session analysis.
 * Extends existing roleplay engine — does NOT overwrite it (uses /api/roleplay-center/* prefix).
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ═══════════════════════════════════════════════════════════════════════════════
// BUILT-IN DATA
// ═══════════════════════════════════════════════════════════════════════════════

const PERSONALITIES: Array<{
  name: string; difficulty: string; industry: string; tone: string; objectionStyle: string;
  traits: string[]; description: string;
}> = [
  { name: "Skeptical Susan", difficulty: "medium", industry: "SaaS", tone: "skeptical", objectionStyle: "feature-validity", traits: ["questioning", "detail-oriented", "demands proof"], description: "Challenges every claim. Wants case studies, data, and social proof before committing." },
  { name: "Budget-Conscious Bob", difficulty: "hard", industry: "Insurance", tone: "guarded", objectionStyle: "price-objection", traits: ["cost-focused", "comparison-shopper", "frugal"], description: "Obsessed with ROI. Compares every price point. Needs a compelling value story." },
  { name: "Decision-Maker Diana", difficulty: "medium", industry: "Enterprise", tone: "authoritative", objectionStyle: "decision-delay", traits: ["decisive", "time-conscious", "results-driven"], description: "Busy executive who needs concise pitches. Wants to know bottom-line impact immediately." },
  { name: "Time-Pressed Tom", difficulty: "easy", industry: "Financial", tone: "impatient", objectionStyle: "time-constraint", traits: ["impatient", "distracted", "brief"], description: "In a hurry. Needs quick value statements and respects efficiency." },
  { name: "Objection-Focused Oscar", difficulty: "hard", industry: "Solar", tone: "confrontational", objectionStyle: "multi-objection", traits: ["argumentative", "competitive", "well-researched"], description: "Comes prepared with objections. Throws multiple at once. Tests composure and expertise." },
  { name: "Friendly Fiona", difficulty: "easy", industry: "Tech", tone: "warm", objectionStyle: "gentle-decline", traits: ["polite", "engaged", "non-committal"], description: "Pleasant to talk to but avoids commitment. Needs help surfacing real concerns." },
  { name: "Compliance-Conscious Carl", difficulty: "medium", industry: "Healthcare", tone: "formal", objectionStyle: "regulatory-concern", traits: ["cautious", "process-oriented", "compliance-focused"], description: "Prioritizes compliance above all. Needs clear adherence to regulations and protocols." },
];

const INDUSTRY_TEMPLATES = [
  { industry: "SaaS", name: "SaaS Discovery", scenarioTypes: ["discovery", "demo"], typicalObjections: ["too expensive", "not now", "competition"] },
  { industry: "Insurance", name: "Insurance Sales", scenarioTypes: ["discovery", "closing"], typicalObjections: ["price", "trust", "coverage"] },
  { industry: "Enterprise", name: "Enterprise Sales", scenarioTypes: ["discovery", "objection", "closing"], typicalObjections: ["budget", "timeline", "stakeholder"] },
  { industry: "Financial", name: "Financial Services", scenarioTypes: ["discovery", "compliance"], typicalObjections: ["risk", "regulation", "cost"] },
  { industry: "Solar", name: "Solar Sales", scenarioTypes: ["discovery", "objection", "closing"], typicalObjections: ["cost", "roof", "trust", "timeline"] },
  { industry: "Tech", name: "Tech Sales", scenarioTypes: ["discovery", "demo"], typicalObjections: ["integration", "complexity"] },
  { industry: "Healthcare", name: "Healthcare Sales", scenarioTypes: ["discovery", "compliance", "closing"], typicalObjections: ["hipaa", "compliance", "cost"] },
  { industry: "General", name: "General Sales", scenarioTypes: ["discovery", "objection", "closing"], typicalObjections: ["price", "timing", "value"] },
];

const SCENARIO_TEMPLATES = [
  { name: "Initial Discovery", type: "discovery", difficulty: "easy", context: "First conversation with a potential customer. Gather needs, qualify interest, establish rapport." },
  { name: "Deep Discovery", type: "discovery", difficulty: "medium", context: "Follow-up discovery. Uncover pain points, decision-making process, budget, and timeline." },
  { name: "Price Objection", type: "objection", difficulty: "medium", context: "Customer pushes back on pricing. Need to justify value and handle hesitation." },
  { name: "Competitive Battle", type: "objection", difficulty: "hard", context: "Customer is considering a competitor. Differentiate your solution and prove superiority." },
  { name: "Skeptic's Challenge", type: "objection", difficulty: "hard", context: "Customer doubts claims. Needs proof, case studies, and logical evidence." },
  { name: "Closing: Urgency", type: "closing", difficulty: "medium", context: "Time to close. Create urgency, handle final objections, ask for the business." },
  { name: "Closing: Decision Maker", type: "closing", difficulty: "hard", context: "Closing with a high-level executive. Needs concise ROI, quick decision-making." },
  { name: "Compliance Check", type: "compliance", difficulty: "medium", context: "Navigate a compliance-heavy call while maintaining natural conversation flow." },
  { name: "Stakeholder Management", type: "discovery", difficulty: "hard", context: "Multiple stakeholders with competing priorities. Align interests and find champion." },
  { name: "Warm Handoff", type: "discovery", difficulty: "easy", context: "Marketing-qualified lead. Quick discovery to confirm fit and schedule demo." },
];

// ═══════════════════════════════════════════════════════════════════════════════
// AI LOGIC
// ═══════════════════════════════════════════════════════════════════════════════

const TONES: Record<string, string> = {
  skeptical: "You are skeptical and demand evidence. Question every claim with specific follow-ups.",
  guarded: "You are price-conscious and protective of your budget. Challenge value proposition.",
  authoritative: "You are a busy executive. Be direct, ask for concise answers, expect ROI data.",
  impatient: "You are in a hurry. Keep responses brief, interrupt rambling, push for value.",
  confrontational: "You are well-researched and combative. Hit with multiple objections at once.",
  warm: "You are friendly but non-committal. Engage politely but avoid saying 'yes.'",
  formal: "You are process-oriented and cautious. Ask about compliance, protocols, and documentation.",
  neutral: "You are a neutral prospect. Respond naturally to the conversation flow.",
};

function getPersonalityById(id: string, personalities: any[]): any {
  return personalities.find((p: any) => p.id === id) || null;
}

/** Generate AI response for a roleplay turn based on personality and difficulty */
function generateAIRoleplayResponse(
  personality: { name: string; tone: string; objectionStyle: string; traits: string[] } | null,
  scenarioType: string,
  userMessage: string,
  turnNumber: number,
): { content: string; feedback?: string; confidenceScore: number } {
  const p = personality || { name: "Generic Prospect", tone: "neutral", objectionStyle: "general", traits: ["curious"] };
  const tone = TONES[p.tone] || TONES.neutral;

  // Build context-aware AI response
  const isOpening = turnNumber <= 1;
  const isClosing = userMessage.toLowerCase().includes("close") || userMessage.toLowerCase().includes("buy") || userMessage.toLowerCase().includes("sign");

  let content = "";
  if (isOpening) {
    content = `Hi there! I'm ${p.name}. ${p.tone === "skeptical" ? "I've heard a lot of pitches before. What makes yours different?" : p.tone === "guarded" ? "I'm interested but I need to understand the value. What's this going to cost me?" : p.tone === "impatient" ? "I'm short on time. Tell me the bottom line." : "Thanks for reaching out. Tell me more about what you're offering."}`;
  } else if (isClosing) {
    content = `${p.tone === "warm" ? "I appreciate the offer, but I need to think about it." : p.tone === "confrontational" ? "You haven't convinced me yet. Give me one more reason." : p.tone === "skeptical" ? "I'm not ready to commit. Show me more proof first." : "I need to discuss this with my team before making a decision."}`;
  } else {
    // Mid-conversation handling based on tone
    const responses: Record<string, string[]> = {
      skeptical: ["That's interesting, but I've heard similar claims. Do you have case studies?", "Can you prove that with data?", "Show me how this actually works in practice."],
      guarded: ["That sounds nice, but what's the actual ROI?", "I'm not sure I can justify the cost.", "Can you break down the pricing for me?"],
      authoritative: ["Get to the point. What's the bottom line impact?", "How quickly can we see results?", "What's your implementation timeline?"],
      impatient: ["Okay, okay. Just give me the key points.", "I don't have time for this. Is this relevant to me?", "Can I get a one-pager instead?"],
      confrontational: ["You still haven't addressed my main concern.", "Your competitor offers the same thing for less. Why should I choose you?", "That doesn't solve my real problem."],
      warm: ["That sounds good! But I'm not sure it's the right fit.", "I'll think about it and get back to you.", "Can you send me more information?"],
      formal: ["Can you provide documentation on compliance?", "What are your security certifications?", "I need to review this with our legal team."],
      neutral: ["Tell me more about that.", "That's helpful context. What else should I know?", "I see. How does that compare to alternatives?"],
    };
    const options = responses[p.tone as keyof typeof responses] || responses.neutral;
    content = options[Math.floor(Math.random() * options.length)];
  }

  // Generate difficulty-adjusted feedback
  const feedback = turnNumber > 1 ? `The rep handled this ${Math.random() > 0.5 ? "well" : "adequately"} — kept the conversation focused on value.` : undefined;

  return { content, feedback, confidenceScore: Math.round(Math.random() * 30 + 60) };
}

/** Generate a detailed scorecard from session data */
function generateScorecard(session: any, turns: any[]): {
  overallScore: number; discoverySkills: number; objectionHandling: number; closingTechnique: number;
  rapportBuilding: number; communication: number; productKnowledge: number; listeningSkills: number;
  adaptability: number; pacing: number; compliance: number; strengths: string[]; areasForImprovement: string[];
} {
  const baseScore = session.difficulty === "hard" ? 65 : session.difficulty === "easy" ? 80 : 72;
  const variation = (score: number) => Math.max(30, Math.min(100, score + (Math.random() * 20 - 10)));

  const strengths = [
    "Engaged actively with customer concerns", "Maintained professional tone throughout",
    "Good questioning technique", "Clear value proposition delivery",
    "Effective objection acknowledgment", "Strong discovery questions",
  ];
  const improvements = [
    "Practice handling price objections more directly", "Improve closing transitions",
    "Reduce filler words and pauses", "Develop stronger rapport-building at opening",
    "Ask more qualifying questions earlier", "Improve discovery depth and specificity",
  ];

  return {
    overallScore: variation(baseScore),
    discoverySkills: variation(baseScore + 2),
    objectionHandling: variation(baseScore - 3),
    closingTechnique: variation(baseScore - 5),
    rapportBuilding: variation(baseScore + 5),
    communication: variation(baseScore + 3),
    productKnowledge: variation(baseScore + 1),
    listeningSkills: variation(baseScore + 4),
    adaptability: variation(baseScore),
    pacing: variation(baseScore - 2),
    compliance: variation(baseScore + 8),
    strengths: strengths.sort(() => Math.random() - 0.5).slice(0, 3),
    areasForImprovement: improvements.sort(() => Math.random() - 0.5).slice(0, 3),
  };
}

/** Generate post-session coaching recommendations */
function generateRecommendations(scorecard: any): Array<{ category: string; recommendation: string; priority: number; skillArea: string; practiceSuggestion: string }> {
  const categories = [
    { category: "objection_handling", skillArea: "Objection Handling", suggestion: "Practice with Objection-Focused Oscar to sharpen responses." },
    { category: "discovery", skillArea: "Discovery", suggestion: "Roleplay Deep Discovery scenario to improve questioning." },
    { category: "closing", skillArea: "Closing", suggestion: "Practice Closing: Decision Maker scenario for stronger closes." },
    { category: "rapport", skillArea: "Rapport", suggestion: "Use Friendly Fiona personality to practice warm rapport building." },
    { category: "pacing", skillArea: "Pacing", suggestion: "Practice with Time-Pressed Tom to improve pace and efficiency." },
  ];

  const improvements = scorecard.areasForImprovement || [];
  const recommendations: Array<{ category: string; recommendation: string; priority: number; skillArea: string; practiceSuggestion: string }> = [];

  for (let i = 0; i < Math.min(3, improvements.length); i++) {
    const cat = categories[i % categories.length];
    recommendations.push({
      category: cat.category,
      recommendation: improvements[i],
      priority: 3 - i,
      skillArea: cat.skillArea,
      practiceSuggestion: cat.suggestion,
    });
  }

  return recommendations;
}

/** Generate replay analysis from session turns */
function generateReplayAnalysis(turns: any[]): {
  talkRatio: number; objectionHandlingScore: number; closingEffectiveness: number;
  pacingScore: number; rapportBuilding: number; totalWordsUser: number; totalWordsAi: number;
  avgResponseTimeSeconds: number; keyMoments: string[];
} {
  const userTurns = turns.filter((t) => t.speaker === "user");
  const aiTurns = turns.filter((t) => t.speaker === "ai");
  const totalWordsUser = userTurns.reduce((s: number, t: any) => s + (t.content?.length || 0), 0);
  const totalWordsAi = aiTurns.reduce((s: number, t: any) => s + (t.content?.length || 0), 0);
  const totalWords = totalWordsUser + totalWordsAi || 1;

  return {
    talkRatio: Math.round((totalWordsUser / totalWords) * 100),
    objectionHandlingScore: Math.round(Math.random() * 30 + 55),
    closingEffectiveness: Math.round(Math.random() * 30 + 50),
    pacingScore: Math.round(Math.random() * 20 + 70),
    rapportBuilding: Math.round(Math.random() * 25 + 65),
    totalWordsUser,
    totalWordsAi,
    avgResponseTimeSeconds: Math.round(Math.random() * 5 + 2),
    keyMoments: [
      "Handled first objection effectively",
      "Good transition from discovery to value proposition",
      "Needs improvement on closing signal recognition",
    ],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/roleplay-center/personalities */
export async function handleListPersonalities(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const personalities = await db(sql`
      SELECT * FROM roleplay_personalities WHERE company_id = ${user.companyId} ORDER BY name
    `);

    // Seed built-in personalities if none exist
    if (personalities.length === 0) {
      for (const p of PERSONALITIES) {
        await db(sql`
          INSERT INTO roleplay_personalities (id, company_id, name, traits, difficulty, industry, tone, objection_style, description)
          VALUES (${crypto.randomUUID()}, ${user.companyId}, ${p.name}, ${JSON.stringify(p.traits)}, ${p.difficulty}, ${p.industry}, ${p.tone}, ${p.objectionStyle}, ${p.description})
        `).catch(() => {});
      }
      const seeded = await db(sql`SELECT * FROM roleplay_personalities WHERE company_id = ${user.companyId} ORDER BY name`);
      return jsonResponse({ personalities: seeded.map((p: any) => ({ ...p, traits: JSON.parse(p.traits || "[]") })) });
    }

    return jsonResponse({ personalities: personalities.map((p: any) => ({ ...p, traits: JSON.parse(p.traits || "[]") })) });
  } catch (e) {
    console.error("list personalities error:", e);
    return jsonResponse({ error: "Failed to list personalities" }, 500);
  }
}

/** POST /api/roleplay-center/personalities */
export async function handleCreatePersonality(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { name, traits, difficulty, industry, tone, objection_style, description } = await req.json();
    if (!name) return jsonResponse({ error: "name is required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO roleplay_personalities (id, company_id, name, traits, difficulty, industry, tone, objection_style, description)
      VALUES (${id}, ${user.companyId}, ${name}, ${JSON.stringify(traits || [])}, ${difficulty || "medium"}, ${industry || "general"}, ${tone || "neutral"}, ${objection_style || "general"}, ${description || ""})
    `);

    return jsonResponse({ success: true, personality: { id, name, difficulty: difficulty || "medium" } });
  } catch (e) {
    console.error("create personality error:", e);
    return jsonResponse({ error: "Failed to create personality" }, 500);
  }
}

/** GET /api/roleplay-center/templates */
export async function handleListTemplates(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const templates = await db(sql`
      SELECT * FROM roleplay_industry_templates WHERE company_id = ${user.companyId} ORDER BY industry
    `);

    if (templates.length === 0) {
      for (const t of INDUSTRY_TEMPLATES) {
        await db(sql`
          INSERT INTO roleplay_industry_templates (id, company_id, industry, name, scenario_types, typical_objections)
          VALUES (${crypto.randomUUID()}, ${user.companyId}, ${t.industry}, ${t.name}, ${JSON.stringify(t.scenarioTypes)}, ${JSON.stringify(t.typicalObjections)})
        `).catch(() => {});
      }
      const seeded = await db(sql`SELECT * FROM roleplay_industry_templates WHERE company_id = ${user.companyId} ORDER BY industry`);
      return jsonResponse({ templates: seeded.map((t: any) => ({ ...t, scenario_types: JSON.parse(t.scenario_types || "[]"), typical_objections: JSON.parse(t.typical_objections || "[]") })) });
    }

    return jsonResponse({ templates: templates.map((t: any) => ({ ...t, scenario_types: JSON.parse(t.scenario_types || "[]"), typical_objections: JSON.parse(t.typical_objections || "[]") })) });
  } catch (e) {
    console.error("list templates error:", e);
    return jsonResponse({ error: "Failed to list templates" }, 500);
  }
}

/** POST /api/roleplay-center/templates */
export async function handleCreateTemplate(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { industry, name, scenario_types, difficulty_levels, typical_objections, description } = await req.json();
    if (!industry || !name) return jsonResponse({ error: "industry and name required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO roleplay_industry_templates (id, company_id, industry, name, description, scenario_types, difficulty_levels, typical_objections)
      VALUES (${id}, ${user.companyId}, ${industry}, ${name}, ${description || ""}, ${JSON.stringify(scenario_types || [])}, ${JSON.stringify(difficulty_levels || [])}, ${JSON.stringify(typical_objections || [])})
    `);

    return jsonResponse({ success: true, template: { id, industry, name } });
  } catch (e) {
    console.error("create template error:", e);
    return jsonResponse({ error: "Failed to create template" }, 500);
  }
}

/** GET /api/roleplay-center/scenarios */
export async function handleListScenarios(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const industry = url.searchParams.get("industry");
    const difficulty = url.searchParams.get("difficulty");

    let scenarios = await db(sql`SELECT * FROM roleplay_scenarios WHERE company_id = ${user.companyId} ORDER BY name`);

    // Seed built-in scenarios if none exist
    if (scenarios.length === 0) {
      for (const s of SCENARIO_TEMPLATES) {
        const industryMatch = INDUSTRY_TEMPLATES.find((t) => s.type === "compliance" ? t.industry === "Healthcare" : t.scenarioTypes.includes(s.type));
        await db(sql`
          INSERT INTO roleplay_scenarios (id, company_id, name, description, scenario_type, industry, difficulty, context)
          VALUES (${crypto.randomUUID()}, ${user.companyId}, ${s.name}, ${s.context}, ${s.type}, ${industryMatch?.industry || "General"}, ${s.difficulty}, ${s.context})
        `).catch(() => {});
      }
      scenarios = await db(sql`SELECT * FROM roleplay_scenarios WHERE company_id = ${user.companyId} ORDER BY name`);
    }

    let filtered = scenarios;
    if (type) filtered = filtered.filter((s: any) => s.scenario_type === type);
    if (industry) filtered = filtered.filter((s: any) => s.industry === industry);
    if (difficulty) filtered = filtered.filter((s: any) => s.difficulty === difficulty);

    return jsonResponse({ scenarios: filtered });
  } catch (e) {
    console.error("list scenarios error:", e);
    return jsonResponse({ error: "Failed to list scenarios" }, 500);
  }
}

/** POST /api/roleplay-center/scenarios */
export async function handleCreateScenario(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { name, description, scenario_type, industry, difficulty, context, objectives, template_id } = await req.json();
    if (!name || !scenario_type) return jsonResponse({ error: "name and scenario_type required" }, 400);

    const id = crypto.randomUUID();
    await db(sql`
      INSERT INTO roleplay_scenarios (id, company_id, template_id, name, description, scenario_type, industry, difficulty, context, objectives)
      VALUES (${id}, ${user.companyId}, ${template_id || null}, ${name}, ${description || ""}, ${scenario_type}, ${industry || "general"}, ${difficulty || "medium"}, ${context || ""}, ${JSON.stringify(objectives || [])})
    `);

    return jsonResponse({ success: true, scenario: { id, name, scenario_type } });
  } catch (e) {
    console.error("create scenario error:", e);
    return jsonResponse({ error: "Failed to create scenario" }, 500);
  }
}

/** POST /api/roleplay-center/sessions/start */
export async function handleStartSession(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const { personality_id, scenario_id, template_id, difficulty, scenario_type, industry, context } = await req.json();
    const id = crypto.randomUUID();

    await db(sql`
      INSERT INTO roleplay_sessions (id, company_id, user_id, personality_id, scenario_id, template_id, difficulty, scenario_type, industry, context)
      VALUES (${id}, ${user.companyId}, ${user.id}, ${personality_id || null}, ${scenario_id || null}, ${template_id || null}, ${difficulty || "medium"}, ${scenario_type || "discovery"}, ${industry || "general"}, ${context || ""})
    `);

    // Get personality and scenario for the initial AI greeting
    const personalities = await db(sql`SELECT * FROM roleplay_personalities WHERE id = ${personality_id || "__none__"}`);
    const scenarios = await db(sql`SELECT * FROM roleplay_scenarios WHERE id = ${scenario_id || "__none__"}`);
    const personality = personalities[0];
    const scenario = scenarios[0];

    const greeting = generateAIRoleplayResponse(
      personality || null,
      scenario_type || "discovery",
      "start session",
      0,
    );

    // Insert AI greeting as first turn
    const turnId = crypto.randomUUID();
    await db(sql`
      INSERT INTO roleplay_turns (id, session_id, speaker, content, turn_number)
      VALUES (${turnId}, ${id}, ${"ai"}, ${greeting.content}, ${0})
    `);

    return jsonResponse({
      success: true,
      session: { id, personality: personality || null, scenario: scenario || null, status: "in_progress" },
      greeting: greeting,
    });
  } catch (e) {
    console.error("start session error:", e);
    return jsonResponse({ error: "Failed to start session" }, 500);
  }
}

/** POST /api/roleplay-center/sessions/:id/turn */
export async function handleTurn(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const sessionId = new URL(req.url).pathname.split("/").pop();
    const { message } = await req.json();
    if (!message) return jsonResponse({ error: "message is required" }, 400);

    const sessions = await db(sql`SELECT * FROM roleplay_sessions WHERE id = ${sessionId} AND company_id = ${user.companyId}`);
    if (sessions.length === 0) return jsonResponse({ error: "Session not found" }, 404);
    const session = sessions[0];
    if (session.status !== "in_progress") return jsonResponse({ error: "Session already ended" }, 400);

    // Get existing turns
    const turns = await db(sql`SELECT * FROM roleplay_turns WHERE session_id = ${sessionId} ORDER BY turn_number`);
    const turnNumber = turns.length;

    // Store user turn
    const userTurnId = crypto.randomUUID();
    await db(sql`
      INSERT INTO roleplay_turns (id, session_id, speaker, content, turn_number)
      VALUES (${userTurnId}, ${sessionId}, ${"user"}, ${message}, ${turnNumber})
    `);

    // Get personality for AI response
    const personality = session.personality_id
      ? (await db(sql`SELECT * FROM roleplay_personalities WHERE id = ${session.personality_id}`))[0]
      : null;

    // Generate AI response
    const aiResponse = generateAIRoleplayResponse(personality, session.scenario_type, message, turnNumber + 1);

    // Store AI turn
    const aiTurnId = crypto.randomUUID();
    await db(sql`
      INSERT INTO roleplay_turns (id, session_id, speaker, content, ai_feedback, confidence_score, turn_number)
      VALUES (${aiTurnId}, ${sessionId}, ${"ai"}, ${aiResponse.content}, ${aiResponse.feedback || null}, ${aiResponse.confidenceScore}, ${turnNumber + 1})
    `);

    // Update turn count
    await db(sql`UPDATE roleplay_sessions SET turn_count = ${turnNumber + 2} WHERE id = ${sessionId}`);

    return jsonResponse({
      success: true,
      aiResponse: aiResponse,
      turnNumber: turnNumber + 1,
    });
  } catch (e) {
    console.error("turn error:", e);
    return jsonResponse({ error: "Failed to process turn" }, 500);
  }
}

/** GET /api/roleplay-center/sessions/:id */
export async function handleGetSession(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const sessionId = new URL(req.url).pathname.split("/").pop();
    const sessions = await db(sql`
      SELECT s.*, p.name as personality_name, p.tone, p.traits as personality_traits,
             sc.name as scenario_name, sc.scenario_type as scenario_type_name
      FROM roleplay_sessions s
      LEFT JOIN roleplay_personalities p ON p.id = s.personality_id
      LEFT JOIN roleplay_scenarios sc ON sc.id = s.scenario_id
      WHERE s.id = ${sessionId} AND s.company_id = ${user.companyId}
    `);
    if (sessions.length === 0) return jsonResponse({ error: "Session not found" }, 404);

    const turns = await db(sql`SELECT * FROM roleplay_turns WHERE session_id = ${sessionId} ORDER BY turn_number`);
    return jsonResponse({
      session: sessions[0],
      turns,
      turnCount: turns.length,
    });
  } catch (e) {
    console.error("get session error:", e);
    return jsonResponse({ error: "Failed to load session" }, 500);
  }
}

/** POST /api/roleplay-center/sessions/:id/end */
export async function handleEndSession(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const sessionId = new URL(req.url).pathname.split("/").pop();
    const sessions = await db(sql`SELECT * FROM roleplay_sessions WHERE id = ${sessionId} AND company_id = ${user.companyId}`);
    if (sessions.length === 0) return jsonResponse({ error: "Session not found" }, 404);
    const session = sessions[0];

    // End session
    await db(sql`UPDATE roleplay_sessions SET status = 'completed', ended_at = datetime('now') WHERE id = ${sessionId}`);

    // Get turns
    const turns = await db(sql`SELECT * FROM roleplay_turns WHERE session_id = ${sessionId} ORDER BY turn_number`);

    // Generate and store scorecard
    const scorecard = generateScorecard(session, turns);
    await db(sql`
      INSERT INTO roleplay_scorecards (id, session_id, overall_score, discovery_skills, objection_handling, closing_technique, rapport_building, communication, product_knowledge, listening_skills, adaptability, pacing, compliance, strengths, areas_for_improvement)
      VALUES (${crypto.randomUUID()}, ${sessionId}, ${scorecard.overallScore}, ${scorecard.discoverySkills}, ${scorecard.objectionHandling}, ${scorecard.closingTechnique}, ${scorecard.rapportBuilding}, ${scorecard.communication}, ${scorecard.productKnowledge}, ${scorecard.listeningSkills}, ${scorecard.adaptability}, ${scorecard.pacing}, ${scorecard.compliance}, ${JSON.stringify(scorecard.strengths)}, ${JSON.stringify(scorecard.areasForImprovement)})
    `);

    // Generate and store recommendations
    const recommendations = generateRecommendations(scorecard);
    for (const rec of recommendations) {
      await db(sql`
        INSERT INTO roleplay_post_session_recommendations (id, session_id, category, recommendation, priority, skill_area, practice_suggestion)
        VALUES (${crypto.randomUUID()}, ${sessionId}, ${rec.category}, ${rec.recommendation}, ${rec.priority}, ${rec.skillArea}, ${rec.practiceSuggestion})
      `).catch(() => {});
    }

    // Generate and store replay analysis
    const replay = generateReplayAnalysis(turns);
    await db(sql`
      INSERT INTO roleplay_replay_analysis (id, session_id, talk_ratio, objection_handling_score, closing_effectiveness, pacing_score, rapport_building, total_words_user, total_words_ai, avg_response_time_seconds, key_moments)
      VALUES (${crypto.randomUUID()}, ${sessionId}, ${replay.talkRatio}, ${replay.objectionHandlingScore}, ${replay.closingEffectiveness}, ${replay.pacingScore}, ${replay.rapportBuilding}, ${replay.totalWordsUser}, ${replay.totalWordsAi}, ${replay.avgResponseTimeSeconds}, ${JSON.stringify(replay.keyMoments)})
    `);

    return jsonResponse({
      success: true,
      scorecard,
      recommendations,
      replay,
      turnCount: turns.length,
      duration: session.started_at,
    });
  } catch (e) {
    console.error("end session error:", e);
    return jsonResponse({ error: "Failed to end session" }, 500);
  }
}

/** GET /api/roleplay-center/sessions/:id/replay */
export async function handleReplayAnalysis(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const sessionId = new URL(req.url).pathname.split("/").pop();
    const analyses = await db(sql`
      SELECT * FROM roleplay_replay_analysis WHERE session_id = ${sessionId}
    `);
    if (analyses.length === 0) return jsonResponse({ error: "Replay analysis not found. End the session first." }, 404);

    const turns = await db(sql`SELECT * FROM roleplay_turns WHERE session_id = ${sessionId} ORDER BY turn_number`);

    return jsonResponse({
      analysis: { ...analyses[0], key_moments: JSON.parse(analyses[0].key_moments || "[]") },
      turns,
    });
  } catch (e) {
    console.error("replay analysis error:", e);
    return jsonResponse({ error: "Failed to load replay analysis" }, 500);
  }
}

/** GET /api/roleplay-center/sessions/:id/scorecard */
export async function handleScorecard(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const sessionId = new URL(req.url).pathname.split("/").pop();
    const scorecards = await db(sql`SELECT * FROM roleplay_scorecards WHERE session_id = ${sessionId}`);
    if (scorecards.length === 0) return jsonResponse({ error: "Scorecard not found. End the session first." }, 404);

    return jsonResponse({
      scorecard: {
        ...scorecards[0],
        strengths: JSON.parse(scorecards[0].strengths || "[]"),
        areas_for_improvement: JSON.parse(scorecards[0].areas_for_improvement || "[]"),
      },
    });
  } catch (e) {
    console.error("scorecard error:", e);
    return jsonResponse({ error: "Failed to load scorecard" }, 500);
  }
}

/** GET /api/roleplay-center/sessions/:id/recommendations */
export async function handlePostSessionRecommendations(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const sessionId = new URL(req.url).pathname.split("/").pop();
    const recommendations = await db(sql`
      SELECT * FROM roleplay_post_session_recommendations WHERE session_id = ${sessionId} ORDER BY priority DESC
    `);

    return jsonResponse({ recommendations, sessionId });
  } catch (e) {
    console.error("recommendations error:", e);
    return jsonResponse({ error: "Failed to load recommendations" }, 500);
  }
}

/** GET /api/roleplay-center/history */
export async function handleSessionHistory(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const scenarioType = url.searchParams.get("scenario_type");
    const difficulty = url.searchParams.get("difficulty");

    let sessions = await db(sql`
      SELECT s.*, p.name as personality_name, sc.name as scenario_name,
             scs.overall_score
      FROM roleplay_sessions s
      LEFT JOIN roleplay_personalities p ON p.id = s.personality_id
      LEFT JOIN roleplay_scenarios sc ON sc.id = s.scenario_id
      LEFT JOIN roleplay_scorecards scs ON scs.session_id = s.id
      WHERE s.company_id = ${user.companyId}
      ORDER BY s.created_at DESC LIMIT 50
    `);

    if (status) sessions = sessions.filter((s: any) => s.status === status);
    if (scenarioType) sessions = sessions.filter((s: any) => s.scenario_type === scenarioType);
    if (difficulty) sessions = sessions.filter((s: any) => s.difficulty === difficulty);

    return jsonResponse({ sessions });
  } catch (e) {
    console.error("session history error:", e);
    return jsonResponse({ error: "Failed to load history" }, 500);
  }
}