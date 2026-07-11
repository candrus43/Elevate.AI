/**
 * ElevateAI Call Analysis Engine
 *
 * Generates realistic call analysis results based on call metadata,
 * detects topics, objections, compliance issues, and updates metrics.
 */

// ─── Topic library by call direction ────────────────────────

const topicLibrary: Record<string, string[]> = {
  inbound: [
    "product inquiry", "pricing discussion", "feature request",
    "support question", "account management", "billing inquiry",
    "onboarding help", "technical support", "upgrade discussion",
    "renewal conversation", "feedback collection", "satisfaction survey",
  ],
  outbound: [
    "cold outreach", "introductory call", "demo request",
    "follow-up call", "prospecting", "needs discovery",
    "qualification call", "value pitch", "objection handling",
    "closing attempt", "market research", "event follow-up",
  ],
};

// ─── Objection library ──────────────────────────────────────

const objectionLibrary = [
  { keyword: "too expensive", objection: "pricing concern", category: "price" },
  { keyword: "budget", objection: "budget limitation", category: "price" },
  { keyword: "no budget", objection: "no budget allocated", category: "price" },
  { keyword: "not now", objection: "bad timing", category: "timing" },
  { keyword: "not interested", objection: "lack of interest", category: "interest" },
  { keyword: "competitor", objection: "competitor comparison", category: "competition" },
  { keyword: "competition", objection: "competitor evaluation", category: "competition" },
  { keyword: "happy with", objection: "satisfied with current solution", category: "competition" },
  { keyword: "don't need", objection: "no perceived need", category: "need" },
  { keyword: "not a priority", objection: "not a priority", category: "timing" },
  { keyword: "call back", objection: "requested call back", category: "timing" },
  { keyword: "send info", objection: "requested information", category: "timing" },
  { keyword: "too busy", objection: "too busy to engage", category: "timing" },
  { keyword: "decision", objection: "waiting on decision maker", category: "process" },
  { keyword: "approval", objection: "needs approval", category: "process" },
  { keyword: "legal", objection: "legal review needed", category: "process" },
  { keyword: "contract", objection: "contract concerns", category: "process" },
  { keyword: "implementation", objection: "implementation concerns", category: "product" },
  { keyword: "integration", objection: "integration concerns", category: "product" },
  { keyword: "security", objection: "security concerns", category: "product" },
  { keyword: "privacy", objection: "privacy concerns", category: "product" },
  { keyword: "training", objection: "training concerns", category: "product" },
  { keyword: "support", objection: "support concerns", category: "product" },
  { keyword: "guarantee", objection: "asked for guarantee", category: "risk" },
  { keyword: "refund", objection: "refund inquiry", category: "risk" },
  { keyword: "trial", objection: "asked for trial", category: "process" },
  { keyword: "demo", objection: "requested demo", category: "interest" },
  { keyword: "reference", objection: "requested references", category: "risk" },
  { keyword: "case study", objection: "requested case studies", category: "interest" },
  { keyword: "roi", objection: "ROI discussion", category: "value" },
  { keyword: "value", objection: "value question", category: "value" },
  { keyword: "comparing", objection: "comparison shopping", category: "competition" },
  { keyword: "different", objection: "differentiation question", category: "competition" },
];

// ─── Compliance phrase libraries ───────────────────────────

const compliancePhrases = {
  positive: [
    "we offer flexible pricing options",
    "there is no obligation to purchase",
    "this call may be recorded for quality purposes",
    "i appreciate your time today",
    "let me check on that for you",
    "our satisfaction guarantee covers",
    "you can cancel at any time",
    "your information is kept confidential",
    "i want to make sure this is the right fit",
    "let me be transparent with you",
  ],
  negative: [
    "i guarantee you'll see results",
    "this is a risk-free investment",
    "you won't find a better deal anywhere else",
    "we're the best in the industry",
    "our solution is 100% effective",
    "this offer is only available today",
    "you'd be crazy to pass this up",
    "sign up now before it's too late",
    "i promise you won't regret this",
    "everyone loves our product",
  ],
};

// ─── Score calculation ──────────────────────────────────────

export function calculateScore(durationSeconds: number, direction: string, objectionCount: number): number {
  let base = 70;

  // Duration bonus: calls 3-15 min are ideal
  if (durationSeconds >= 180 && durationSeconds <= 900) {
    base += 10;
  } else if (durationSeconds >= 60 && durationSeconds < 180) {
    base += 5; // Short but meaningful
  } else if (durationSeconds > 900 && durationSeconds <= 1800) {
    base += 0; // Long but acceptable
  } else if (durationSeconds > 1800) {
    base -= 10; // Too long
  } else {
    base -= 15; // Too short
  }

  // Direction bonus: outbound is generally harder
  if (direction === "inbound") {
    base += 5;
  }

  // Objection handling bonus (moderate objections = good)
  if (objectionCount >= 2 && objectionCount <= 5) {
    base += 8; // Good engagement with objections
  } else if (objectionCount > 5) {
    base += 3; // Many objections handled
  } else if (objectionCount === 0) {
    base -= 5; // No objections might mean no push for commitment
  }

  // Add some randomness (-5 to +5)
  base += Math.floor(Math.random() * 11) - 5;

  // Clamp to 0-100
  return Math.max(0, Math.min(100, base));
}

// ─── Sentiment calculation ──────────────────────────────────

export function calculateSentiment(score: number): string {
  if (score >= 80) return "positive";
  if (score >= 60) return "neutral";
  return "negative";
}

// ─── Topic detection ────────────────────────────────────────

export function detectTopics(direction: string, durationSeconds: number): string[] {
  const library = topicLibrary[direction] || topicLibrary.outbound;
  const topicCount = durationSeconds > 600 ? 4 : durationSeconds > 180 ? 3 : 2;
  const shuffled = [...library].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(topicCount, library.length));
}

// ─── Objection detection ────────────────────────────────────

export function detectObjections(): Array<{ objection: string; category: string }> {
  const count = Math.floor(Math.random() * 4); // 0-3 objections
  const shuffled = [...objectionLibrary].sort(() => Math.random() - 0.5);
  const seenCategories = new Set<string>();

  return shuffled.slice(0, count).reduce((acc, item) => {
    // Avoid duplicate categories
    if (!seenCategories.has(item.category)) {
      seenCategories.add(item.category);
      acc.push({ objection: item.objection, category: item.category });
    }
    return acc;
  }, [] as Array<{ objection: string; category: string }>);
}

// ─── Summary generation ─────────────────────────────────────

export function generateSummary(
  score: number,
  sentiment: string,
  direction: string,
  durationSeconds: number,
  topics: string[],
  objections: Array<{ objection: string; category: string }>,
): string {
  const durationMin = Math.round(durationSeconds / 60);
  const topicList = topics.slice(0, 3).join(", ");

  let summary = `A ${durationMin}-minute ${direction} call with `;

  if (score >= 85) {
    summary += "strong overall performance. ";
  } else if (score >= 70) {
    summary += "solid performance with room for improvement. ";
  } else if (score >= 50) {
    summary += "mixed results requiring attention. ";
  } else {
    summary += "significant improvement needed. ";
  }

  if (topics.length > 0) {
    summary += `Key topics discussed: ${topicList}. `;
  }

  if (sentiment === "positive") {
    summary += "The conversation maintained a positive tone throughout. ";
  } else if (sentiment === "negative") {
    summary += "The conversation had tension points that need to be addressed. ";
  } else {
    summary += "The conversation was neutral in tone. ";
  }

  if (objections.length > 0) {
    summary += `Objections raised: ${objections.map(o => o.objection).join(", ")}. `;
    summary += "Focus on objection handling techniques for future calls.";
  } else {
    summary += "No significant objections were raised during the call.";
  }

  return summary;
}

// ─── Points calculation ─────────────────────────────────────

export function calculatePoints(score: number): number {
  if (score >= 90) return 50;  // Excellent
  if (score >= 80) return 25;  // Great
  if (score >= 70) return 15;  // Good
  if (score >= 50) return 10;  // Average
  return 5;                     // Needs improvement
}