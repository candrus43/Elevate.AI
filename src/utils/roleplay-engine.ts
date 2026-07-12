/**
 * ElevateAI Role-Play Engine
 *
 * Rule-based AI engine that provides contextual coaching responses,
 * scores user performance, and tracks conversation state.
 *
 * Each scenario has:
 *  - A setup (context the AI sets up)
 *  - Conversation stages with expected responses
 *  - Scoring criteria evaluated per turn
 *  - Dynamic feedback generation
 */

// ─── Types ─────────────────────────────────────────────────

export interface ScenarioConfig {
  id: number;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  description: string;
  context: string;           // Initial briefing for the AI
  persona: string;           // Who the AI plays
  stages: ScenarioStage[];
  scoringCriteria: ScoringCriterion[];
  maxTurns: number;
}

export interface ScenarioStage {
  id: number;
  name: string;
  aiPrompt: string;          // What the AI says to start this stage
  keywords: string[];        // Keywords the user should hit
  expectedConcepts: string[]; // Concepts to check for
  followUp: string;          // AI response template (filled with detected concepts)
}

export interface ScoringCriterion {
  id: string;
  name: string;
  weight: number;            // 0-1 weight for final score
  description: string;
}

export interface RolePlayMessage {
  role: "user" | "ai";
  text: string;
  score?: number;
  feedback?: string;
}

export interface RolePlayState {
  sessionId: string | null;
  scenarioId: number;
  stage: number;             // Current stage index
  turn: number;              // Current turn number
  messages: RolePlayMessage[];
  scores: number[];          // Per-turn scores
  feedbacks: string[];       // Per-turn feedback
  startTime: number;         // timestamp ms
  isComplete: boolean;
}

export interface RolePlayResponse {
  message: string;
  score: number;
  feedback: string;
  stage: number;
  turn: number;
  isComplete: boolean;
  overallScore: number;
  summaryFeedback: string;
}

// ─── Scenario Definitions ──────────────────────────────────

const scenarios: ScenarioConfig[] = [
  {
    id: 1,
    title: "Cold Call Opening",
    difficulty: "Beginner",
    description: "Practice a cold call introduction and value pitch to a new prospect.",
    context: "You are a sales rep calling a prospect who hasn't heard of your company before.",
    persona: "A busy marketing director at a mid-size company",
    stages: [
      {
        id: 1,
        name: "Introduction",
        aiPrompt: "Hello? This is Sarah.",
        keywords: ["hello", "hi", "good morning", "good afternoon", "this is", "calling from", "name is"],
        expectedConcepts: ["greeting", "introduction", "company name", "purpose"],
        followUp: "Alright, I'm listening. Why are you calling today?",
      },
      {
        id: 2,
        name: "Value Pitch",
        aiPrompt: "I'm not sure I need this. What makes you different?",
        keywords: ["help", "improve", "increase", "save", "solution", "platform", "tool", "benefit", "roi", "result"],
        expectedConcepts: ["value proposition", "differentiator", "benefit", "relevance"],
        followUp: "Interesting. Can you tell me more about how it works?",
      },
      {
        id: 3,
        name: "Qualification",
        aiPrompt: "That sounds useful. How does pricing work?",
        keywords: ["understand", "need", "challenge", "goal", "budget", "timeline", "decision", "team", "process"],
        expectedConcepts: ["discovery question", "need identification", "next step"],
        followUp: "That makes sense. What would the next steps be?",
      },
      {
        id: 4,
        name: "Close",
        aiPrompt: "I'd like to think about it. Can you send me some info?",
        keywords: ["meeting", "demo", "call", "calendar", "next steps", "follow up", "send", "proposal"],
        expectedConcepts: ["call to action", "specific next step", "time commitment"],
        followUp: "Great, let's set that up. Thank you for your time!",
      },
    ],
    scoringCriteria: [
      { id: "greeting", name: "Professional Greeting", weight: 0.15, description: "Polite, confident introduction" },
      { id: "clarity", name: "Clear Value Proposition", weight: 0.25, description: "Articulates value clearly" },
      { id: "engagement", name: "Engagement & Discovery", weight: 0.25, description: "Asks good discovery questions" },
      { id: "closing", name: "Closing Ability", weight: 0.20, description: "Sets clear next steps" },
      { id: "professionalism", name: "Professionalism", weight: 0.15, description: "Tone, pace, and polish" },
    ],
    maxTurns: 12,
  },
  {
    id: 2,
    title: "Handling Objections",
    difficulty: "Intermediate",
    description: "Respond to common objections like pricing, timing, and competition.",
    context: "You're in a follow-up call with a prospect who has concerns.",
    persona: "A skeptical procurement manager",
    stages: [
      {
        id: 1,
        name: "Price Objection",
        aiPrompt: "I've looked at your pricing. It's way too expensive for what we need.",
        keywords: ["value", "roi", "investment", "worth", "cost", "budget", "save", "efficient", "long-term", "quality"],
        expectedConcepts: ["value justification", "ROI discussion", "cost-benefit"],
        followUp: "I see. But we still have budget constraints. What else can you do?",
      },
      {
        id: 2,
        name: "Timing Objection",
        aiPrompt: "This isn't the right time for us. We're focused on other priorities right now.",
        keywords: ["understand", "priority", "timeline", "quarter", "plan", "schedule", "soon", "opportunity", "cost of delay"],
        expectedConcepts: ["urgency creation", "flexibility", "understanding"],
        followUp: "Maybe next quarter then. But I'm still not fully convinced.",
      },
      {
        id: 3,
        name: "Competitor Mention",
        aiPrompt: "We're already using a competitor's solution and it works fine for us.",
        keywords: ["understand", "different", "unique", "advantage", "feature", "integration", "switch", "migrate", "better"],
        expectedConcepts: ["competitive differentiation", "specific advantages", "smooth transition"],
        followUp: "I appreciate the explanation. Can you send me a comparison?",
      },
      {
        id: 4,
        name: "Overcoming & Closing",
        aiPrompt: "I'll review the materials. I'm still not 100% sure.",
        keywords: ["meeting", "demo", "trial", "proof", "case study", "reference", "guarantee", "risk-free", "pilot"],
        expectedConcepts: ["risk reduction", "social proof", "next step"],
        followUp: "Fair enough. Let's schedule a quick call to go over it.",
      },
    ],
    scoringCriteria: [
      { id: "empathy", name: "Empathy & Understanding", weight: 0.20, description: "Acknowledges concerns before countering" },
      { id: "value", name: "Value Re-articulation", weight: 0.25, description: "Reframes value in context of objection" },
      { id: "evidence", name: "Evidence & Proof", weight: 0.20, description: "Uses data, cases, or examples" },
      { id: "persistence", name: "Persistence", weight: 0.20, description: "Doesn't give up easily" },
      { id: "closing", name: "Closing Attempt", weight: 0.15, description: "Moves toward next step" },
    ],
    maxTurns: 14,
  },
  {
    id: 3,
    title: "Closing the Deal",
    difficulty: "Advanced",
    description: "Practice closing techniques including assumptive close and urgency-based close.",
    context: "You've had several positive calls with a prospect. Now it's time to close.",
    persona: "An interested but hesitant decision-maker",
    stages: [
      {
        id: 1,
        name: "Trial Close",
        aiPrompt: "I like what I've seen so far. But I need to think about it more.",
        keywords: ["happy", "excited", "confident", "value", "great", "perfect", "solution", "ready", "let's", "proceed"],
        expectedConcepts: ["positive reinforcement", "trial close question", "commitment check"],
        followUp: "The team would need to approve this. What does the process look like?",
      },
      {
        id: 2,
        name: "Handling Final Objections",
        aiPrompt: "My team has some concerns about the implementation timeline.",
        keywords: ["address", "support", "onboarding", "training", "timeline", "migration", "success", "dedicated", "phased"],
        expectedConcepts: ["implementation plan", "support structure", "risk mitigation"],
        followUp: "That sounds manageable. What about pricing flexibility?",
      },
      {
        id: 3,
        name: "Urgency & Scarcity",
        aiPrompt: "We're not in a rush. We can wait a few months.",
        keywords: ["limited", "opportunity", "now", "discount", "promotion", "quarter", "deadline", "soon", "pricing", "effective"],
        expectedConcepts: ["urgency creation", "value acceleration", "mutually beneficial timeline"],
        followUp: "I understand the urgency. But I need to get internal buy-in first.",
      },
      {
        id: 4,
        name: "Assumptive Close",
        aiPrompt: "Let me talk to my team and get back to you.",
        keywords: ["contract", "agreement", "sign", "start", "begin", "onboard", "welcome", "next steps", "paperwork", "implement"],
        expectedConcepts: ["assumptive language", "specific timeline", "clear next step"],
        followUp: "Perfect. I'm looking forward to getting started!",
      },
    ],
    scoringCriteria: [
      { id: "confidence", name: "Confidence & Authority", weight: 0.20, description: "Projects confidence in the solution" },
      { id: "urgency", name: "Urgency Creation", weight: 0.20, description: "Creates legitimate urgency" },
      { id: "objections", name: "Final Objection Handling", weight: 0.25, description: "Addresses last-minute concerns" },
      { id: "assumptive", name: "Assumptive Closing", weight: 0.25, description: "Uses assumptive close techniques" },
      { id: "logistics", name: "Logistics & Next Steps", weight: 0.10, description: "Handles implementation details" },
    ],
    maxTurns: 14,
  },
  {
    id: 4,
    title: "Discovery Call",
    difficulty: "Intermediate",
    description: "Ask the right questions to uncover prospect needs and pain points.",
    context: "You're on a discovery call with a new prospect to understand their needs.",
    persona: "A VP of Sales who's looking for a solution",
    stages: [
      {
        id: 1,
        name: "Opening & Rapport",
        aiPrompt: "Thanks for the call. I'm curious what you have to offer.",
        keywords: ["thanks", "appreciate", "great", "pleasure", "excited", "background", "role", "tell me", "understand"],
        expectedConcepts: ["rapport building", "agenda setting", "background question"],
        followUp: "Good question. Let me give you some context about our current setup.",
      },
      {
        id: 2,
        name: "Pain Point Discovery",
        aiPrompt: "We're using a few different tools but nothing seems to work well together.",
        keywords: ["challenge", "problem", "difficult", "struggle", "pain", "frustrating", "inefficient", "waste", "gap", "missing"],
        expectedConcepts: ["deep discovery question", "specific pain exploration", "impact quantification"],
        followUp: "That's exactly what we're dealing with. How do you typically solve this?",
      },
      {
        id: 3,
        name: "Solution Exploration",
        aiPrompt: "What would an ideal solution look like for you?",
        keywords: ["ideal", "perfect", "solution", "feature", "capability", "integration", "workflow", "automate", "streamline"],
        expectedConcepts: ["solution framing", "feature-benefit connection", "vision alignment"],
        followUp: "That sounds like it could work. How soon could we get started?",
      },
      {
        id: 4,
        name: "Budget & Timeline",
        aiPrompt: "What kind of investment are we looking at?",
        keywords: ["budget", "range", "investment", "annual", "monthly", "roi", "value", "justify", "business case"],
        expectedConcepts: ["budget question", "ROI discussion", "timeline alignment"],
        followUp: "That's reasonable. Let me discuss this with my team.",
      },
    ],
    scoringCriteria: [
      { id: "rapport", name: "Rapport Building", weight: 0.15, description: "Establishes connection" },
      { id: "discovery", name: "Discovery Depth", weight: 0.30, description: "Asks deep, open-ended questions" },
      { id: "listening", name: "Active Listening", weight: 0.25, description: "Builds on prospect's answers" },
      { id: "solution", name: "Solution Framing", weight: 0.20, description: "Connects needs to solution" },
      { id: "qualification", name: "Qualification", weight: 0.10, description: "Covers BANT criteria" },
    ],
    maxTurns: 12,
  },
  {
    id: 5,
    title: "Price Negotiation",
    difficulty: "Advanced",
    description: "Navigate price objections and offer value-based counterarguments.",
    context: "You've presented your proposal. The prospect likes it but wants a discount.",
    persona: "A tough negotiator who wants the best deal",
    stages: [
      {
        id: 1,
        name: "Initial Pushback",
        aiPrompt: "We like the product, but the price is 30% above our budget. Can you do better?",
        keywords: ["value", "worth", "roi", "investment", "quality", "premium", "support", "feature", "included", "comprehensive"],
        expectedConcepts: ["value reinforcement", "price justification", "feature-value link"],
        followUp: "I get that, but we still have a hard cap. Can you match our budget?",
      },
      {
        id: 2,
        name: "Value Negotiation",
        aiPrompt: "Your competitor is offering a similar solution for 20% less.",
        keywords: ["different", "unique", "advantage", "better", "comprehensive", "integration", "support", "uptime", "security", "enterprise"],
        expectedConcepts: ["competitive differentiation", "unique value", "comparison"],
        followUp: "Those are fair points. What about a discount for an annual commitment?",
      },
      {
        id: 3,
        name: "Concession Strategy",
        aiPrompt: "If we commit to annual, what can you offer?",
        keywords: ["annual", "discount", "percentage", "package", "bundle", "tier", "scope", "modify", "customize", "adjust"],
        expectedConcepts: ["concession management", "trade-off", "creative solution"],
        followUp: "That's better. But I need to get this approved by my CFO. Any other flexibility?",
      },
      {
        id: 4,
        name: "Closing the Negotiation",
        aiPrompt: "Alright, let's do it. Send me the contract.",
        keywords: ["agree", "deal", "contract", "sign", "proceed", "accept", "confirmed", "commit", "final", "approved"],
        expectedConcepts: ["confirmation", "next steps", "implementation plan"],
        followUp: "Perfect. I'll have legal review and get back to you by end of day.",
      },
    ],
    scoringCriteria: [
      { id: "poise", name: "Poise Under Pressure", weight: 0.20, description: "Stays calm and professional" },
      { id: "value", name: "Value Defense", weight: 0.25, description: "Defends price with value" },
      { id: "differentiation", name: "Competitive Differentiation", weight: 0.20, description: "Handles competitor comparisons" },
      { id: "creativity", name: "Creative Concessions", weight: 0.20, description: "Finds win-win solutions" },
      { id: "closing", name: "Closing Confidence", weight: 0.15, description: "Confidently asks for the deal" },
    ],
    maxTurns: 14,
  },
];

// ─── Scoring Engine ────────────────────────────────────────

/**
 * Score a user's response based on keyword coverage and response quality.
 * Returns a score 0-100 and textual feedback.
 */
function scoreResponse(
  text: string,
  stage: ScenarioStage,
  criteria: ScoringCriterion[],
  turn: number,
): { score: number; feedback: string } {
  const lower = text.toLowerCase();
  let totalScore = 0;
  let feedbackLines: string[] = [];

  // 1. Keyword coverage (0-60 points)
  const matchedKeywords = stage.keywords.filter((kw) => {
    // Check for keyword as a whole word or partial match
    return lower.includes(kw.toLowerCase());
  });
  const keywordScore = Math.min(60, (matchedKeywords.length / Math.max(1, stage.keywords.length)) * 60);
  totalScore += keywordScore;

  if (matchedKeywords.length > 0) {
    feedbackLines.push(`✅ Good use of relevant terms: "${matchedKeywords.slice(0, 3).join('", "')}"`);
  } else {
    feedbackLines.push(`💡 Try incorporating keywords like: "${stage.keywords.slice(0, 3).join('", "')}"`);
  }

  // 2. Concept coverage (0-30 points)
  const matchedConcepts = stage.expectedConcepts.filter((concept) => {
    const conceptKeywords = concept.toLowerCase().split(/\s+/);
    return conceptKeywords.some((kw) => lower.includes(kw));
  });
  const conceptScore = (matchedConcepts.length / Math.max(1, stage.expectedConcepts.length)) * 30;
  totalScore += conceptScore;

  if (matchedConcepts.length > 0) {
    feedbackLines.push(`✅ Covers key concepts: ${matchedConcepts.join(", ")}`);
  } else {
    feedbackLines.push(`💡 Try addressing: ${stage.expectedConcepts.join(", ")}`);
  }

  // 3. Response quality (0-10 points) — based on length and complexity
  const wordCount = text.split(/\s+/).length;
  if (wordCount >= 15) {
    totalScore += 10;
    feedbackLines.push("✅ Good response length with sufficient detail");
  } else if (wordCount >= 8) {
    totalScore += 5;
    feedbackLines.push("📝 Consider adding more detail to strengthen your response");
  } else {
    feedbackLines.push("💡 Your response is quite brief — expand on your points");
  }

  // 4. Question asking bonus (up to 5 extra points)
  const questionCount = (text.match(/\?/g) || []).length;
  if (questionCount >= 1) {
    totalScore += Math.min(5, questionCount * 2);
    feedbackLines.push("✅ Great use of questions to engage the prospect");
  }

  // 5. Professionalism check (penalty for unprofessional language)
  const unprofessional = ["whatever", "no offense", "i don't care", "your problem", "not my problem"];
  if (unprofessional.some((u) => lower.includes(u))) {
    totalScore = Math.max(0, totalScore - 20);
    feedbackLines.push("⚠️ Avoid unprofessional language in sales conversations");
  }

  // Clamp to 0-100
  totalScore = Math.round(Math.min(100, Math.max(0, totalScore)));

  // Generate overall feedback
  const feedback = feedbackLines.join("\n");

  return { score: totalScore, feedback };
}

/**
 * Generate a contextual AI response based on the scenario, stage, and user input.
 */
function generateAiResponse(
  text: string,
  stage: ScenarioStage,
  scenario: ScenarioConfig,
  turn: number,
): string {
  const lower = text.toLowerCase();
  const stageFollowUp = stage.followUp;

  // Check if the user is asking relevant questions
  const hasQuestion = text.includes("?");
  const hasRelevantConcepts = stage.expectedConcepts.some((c) => {
    const words = c.toLowerCase().split(/\s+/);
    return words.some((w) => lower.includes(w));
  });

  // Adapt the response based on how well the user addressed the stage
  if (hasRelevantConcepts) {
    // User addressed the key concepts — move forward positively
    return stageFollowUp;
  } else if (hasQuestion) {
    // User asked a good question — respond and probe further
    return `${stageFollowUp} Specifically, what aspects are most important to you?`;
  } else if (turn <= 2) {
    // Early in the stage — give more guidance
    return `I appreciate that. Let me ask you this — ${stageFollowUp}`;
  } else {
    // Default — advance the conversation
    return stageFollowUp;
  }
}

// ─── Main Engine ───────────────────────────────────────────

/**
 * Start a new role-play session.
 */
export function startSession(scenarioId: number): {
  state: RolePlayState;
  firstMessage: string;
} {
  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);

  const firstStage = scenario.stages[0];
  const state: RolePlayState = {
    sessionId: null,
    scenarioId,
    stage: 0,
    turn: 0,
    messages: [],
    scores: [],
    feedbacks: [],
    startTime: Date.now(),
    isComplete: false,
  };

  return {
    state,
    firstMessage: firstStage.aiPrompt,
  };
}

/**
 * Process a user message and return the AI response with scoring.
 */
export function processMessage(
  state: RolePlayState,
  userText: string,
): { state: RolePlayState; response: RolePlayResponse } {
  const scenario = scenarios.find((s) => s.id === state.scenarioId);
  if (!scenario) throw new Error(`Scenario ${state.scenarioId} not found`);

  if (state.isComplete) {
    throw new Error("Session is already complete");
  }

  // Add user message
  state.messages.push({ role: "user", text: userText });

  // Get current stage
  const currentStage = scenario.stages[state.stage];

  // Score the user's response
  const { score, feedback } = scoreResponse(
    userText,
    currentStage,
    scenario.scoringCriteria,
    state.turn,
  );
  state.scores.push(score);
  state.feedbacks.push(feedback);

  // Update last user message with score
  const lastMsg = state.messages[state.messages.length - 1];
  lastMsg.score = score;
  lastMsg.feedback = feedback;

  // Generate AI response
  const aiResponse = generateAiResponse(userText, currentStage, scenario, state.turn);
  state.messages.push({ role: "ai", text: aiResponse });

  // Advance to next stage if user did well enough or enough turns in current stage
  state.turn++;
  if (score >= 50 && state.stage < scenario.stages.length - 1) {
    state.stage++;
  }

  // Check if session is complete
  const isComplete = state.turn >= scenario.maxTurns ||
    (state.stage >= scenario.stages.length - 1 && score >= 70);

  if (isComplete) {
    state.isComplete = true;
  }

  // Calculate overall score
  const overallScore = state.scores.length > 0
    ? Math.round(state.scores.reduce((a, b) => a + b, 0) / state.scores.length)
    : 0;

  // Generate summary feedback
  const summaryFeedback = isComplete
    ? generateSummaryFeedback(overallScore, scenario, state.scores)
    : "";

  return {
    state,
    response: {
      message: aiResponse,
      score,
      feedback,
      stage: state.stage,
      turn: state.turn,
      isComplete,
      overallScore,
      summaryFeedback,
    },
  };
}

/**
 * Generate summary feedback at the end of a session.
 */
function generateSummaryFeedback(
  overallScore: number,
  scenario: ScenarioConfig,
  scores: number[],
): string {
  let level: string;
  let recommendation: string;

  if (overallScore >= 85) {
    level = "🌟 Outstanding!";
    recommendation = "You demonstrated excellent sales skills. Focus on refining advanced techniques.";
  } else if (overallScore >= 70) {
    level = "👍 Great job!";
    recommendation = "Strong performance with room for improvement in specific areas. Review the feedback per stage.";
  } else if (overallScore >= 50) {
    level = "📈 Getting there!";
    recommendation = "You have the basics down. Focus on using more targeted language and covering key concepts.";
  } else {
    level = "💪 Keep practicing!";
    recommendation = "Review the scenario objectives and try again. Focus on addressing the key points in each stage.";
  }

  return `${level}\nOverall Score: ${overallScore}/100\n\n${recommendation}\n\nTip: Try to incorporate more of the suggested keywords and concepts in your responses.`;
}

/**
 * Get all available scenarios.
 */
export function getScenarios(): Omit<ScenarioConfig, "stages" | "scoringCriteria">[] {
  return scenarios.map(({ stages, scoringCriteria, ...rest }) => rest);
}

/**
 * Get full scenario config by ID.
 */
export function getScenarioById(id: number): ScenarioConfig | undefined {
  return scenarios.find((s) => s.id === id);
}