/**
 * ElevateAI Coaching Plan Generator
 *
 * Analyzes call analysis results and scorecard weaknesses to auto-generate
 * personalized coaching plans with targeted improvement items.
 */

export interface CallWeakness {
  category: string;
  criterionName: string;
  score: number;
  maxScore: number;
  gap: number; // maxScore - score
  weight: number;
}

export interface CoachingItem {
  title: string;
  description: string;
  resourceUrl?: string;
  sortOrder: number;
}

export interface CoachingPlan {
  title: string;
  description: string;
  items: CoachingItem[];
}

// ─── Mapping: Scorecard criteria categories → coaching items ──

const improvementLibrary: Record<string, Array<{ title: string; description: string; resourceUrl?: string }>> = {
  "Opening": [
    { title: "Watch: Cold Call Opening Techniques", description: "Learn proven cold call opening frameworks to grab prospect attention in the first 15 seconds.", resourceUrl: "/learning/cold-call-opening" },
    { title: "Practice: Value Proposition Pitch", description: "Craft and rehearse a 30-second value proposition that clearly communicates your differentiator.", resourceUrl: "/learning/value-pitch" },
    { title: "Review: Top 3 Opening Scripts", description: "Study the most effective opening scripts used by top-performing reps on your team.", resourceUrl: "/learning/opening-scripts" },
  ],
  "Discovery": [
    { title: "Workshop: BANT Discovery Framework", description: "Master the BANT (Budget, Authority, Need, Timeline) framework for structured discovery calls.", resourceUrl: "/learning/bant-framework" },
    { title: "Practice: Open-Ended Questioning", description: "Learn to ask powerful open-ended questions that uncover deep prospect needs and pain points.", resourceUrl: "/learning/questioning" },
    { title: "Complete: Discovery Call Quiz", description: "Test your knowledge of discovery best practices with this interactive assessment.", resourceUrl: "/learning/discovery-quiz" },
    { title: "Shadow: Discovery Call Masterclass", description: "Shadow a top-performing rep on 3 discovery calls and take notes on their questioning technique.", resourceUrl: "/learning/shadow-discovery" },
  ],
  "Skills": [
    { title: "Video: Objection Handling Framework", description: "Learn the LAER (Listen, Acknowledge, Explore, Respond) framework for handling objections.", resourceUrl: "/learning/objection-framework" },
    { title: "Role-Play: Price Objection Scenario", description: "Practice responding to price objections with a structured role-play exercise.", resourceUrl: "/learning/price-objection" },
    { title: "Role-Play: Competitor Objection Scenario", description: "Practice handling competitor comparisons with confidence and professionalism.", resourceUrl: "/learning/competitor-objection" },
    { title: "Article: Advanced Closing Techniques", description: "Read about assumptive close, summary close, and urgency-based closing techniques.", resourceUrl: "/learning/closing-techniques" },
  ],
  "Messaging": [
    { title: "Workshop: Value Proposition Design", description: "Design and refine your value proposition to better resonate with target prospects.", resourceUrl: "/learning/value-prop-design" },
    { title: "Exercise: ROI Storytelling", description: "Practice crafting compelling ROI stories that make the value of your solution tangible.", resourceUrl: "/learning/roi-storytelling" },
    { title: "Review: Top 10 Email Templates", description: "Study the highest-converting email templates used by your team for follow-ups and outreach.", resourceUrl: "/learning/email-templates" },
  ],
  "Structure": [
    { title: "Guide: Call Structure Framework", description: "Learn the ideal call structure: Opening → Discovery → Presentation → Objections → Close.", resourceUrl: "/learning/call-structure" },
    { title: "Template: Call Planning Worksheet", description: "Use this worksheet to plan your calls with clear objectives, questions, and next steps.", resourceUrl: "/learning/call-planning" },
    { title: "Practice: Next Steps Articulation", description: "Practice clearly articulating next steps and getting commitment from prospects.", resourceUrl: "/learning/next-steps" },
  ],
  "Compliance": [
    { title: "Training: Compliance Script Review", description: "Review required compliance scripts and disclosures for your region and industry.", resourceUrl: "/learning/compliance-scripts" },
    { title: "Quiz: Compliance Knowledge Check", description: "Test your knowledge of compliance requirements with this mandatory assessment.", resourceUrl: "/learning/compliance-quiz" },
    { title: "Guide: Prohibited Language Reference", description: "Review the list of prohibited phrases and language to avoid in sales conversations.", resourceUrl: "/learning/prohibited-language" },
  ],
  "Soft Skills": [
    { title: "Video: Active Listening Techniques", description: "Learn active listening techniques that build rapport and uncover hidden prospect needs.", resourceUrl: "/learning/active-listening" },
    { title: "Practice: Tone & Pace Control", description: "Practice modulating your tone, pace, and energy to match the prospect's communication style.", resourceUrl: "/learning/tone-pace" },
    { title: "Exercise: Rapport Building Drill", description: "Practice building rapport quickly with common social connectors and mirroring techniques.", resourceUrl: "/learning/rapport-building" },
  ],
  "General": [
    { title: "Review: Recent Call Recordings", description: "Review your last 5 call recordings and identify patterns in areas for improvement.", resourceUrl: "/dashboard/calls" },
    { title: "Complete: Sales Fundamentals Course", description: "Enroll in and complete the Sales Fundamentals course to strengthen your core skills.", resourceUrl: "/learning/sales-fundamentals" },
    { title: "Schedule: 1:1 Coaching Session", description: "Schedule a 1:1 coaching session with your manager to discuss areas for improvement.", resourceUrl: "/dashboard/coaching" },
    { title: "Shadow: Top Performer Calls", description: "Shadow 3 calls with a top-performing rep and document their techniques.", resourceUrl: "/learning/shadow" },
  ],
};

// ─── Scoring thresholds ─────────────────────────────────────

const LOW_SCORE_THRESHOLD = 70; // Scores below this trigger improvement items
const SEVERE_THRESHOLD = 50;    // Scores below this trigger multiple items

// ─── Plan generation ────────────────────────────────────────

/**
 * Generate a personalized coaching plan based on call analysis weaknesses.
 * @param weaknesses - Array of identified weaknesses from call analyses and scorecards
 * @param repName - Name of the rep for personalization
 * @returns A coaching plan with title, description, and 3-5 targeted items
 */
export function generateCoachingPlan(weaknesses: CallWeakness[], repName?: string): CoachingPlan {
  const items: CoachingItem[] = [];
  const usedCategories = new Set<string>();
  const addedTitles = new Set<string>();

  // Sort weaknesses by gap (largest gap first = highest priority)
  const sorted = [...weaknesses].sort((a, b) => b.gap - a.gap);

  // Pick items from the improvement library based on weaknesses
  for (const weakness of sorted) {
    if (items.length >= 5) break; // Max 5 items

    const category = weakness.category || "General";
    const library = improvementLibrary[category] || improvementLibrary["General"];
    const severity = weakness.score < SEVERE_THRESHOLD ? 2 : 1; // Severe gets 2 items

    let itemsAdded = 0;
    for (const libItem of library) {
      if (items.length >= 5) break;
      if (itemsAdded >= severity) break;
      if (addedTitles.has(libItem.title)) continue;

      items.push({
        title: libItem.title,
        description: libItem.description,
        resourceUrl: libItem.resourceUrl,
        sortOrder: items.length,
      });
      addedTitles.add(libItem.title);
      itemsAdded++;
    }
    usedCategories.add(category);
  }

  // If we still don't have enough items, add general improvement items
  if (items.length < 3) {
    const general = improvementLibrary["General"];
    for (const item of general) {
      if (items.length >= 3) break;
      if (addedTitles.has(item.title)) continue;
      items.push({
        title: item.title,
        description: item.description,
        resourceUrl: item.resourceUrl,
        sortOrder: items.length,
      });
      addedTitles.add(item.title);
    }
  }

  // Generate plan title based on top weaknesses
  const topCategory = sorted[0]?.category || "Sales";
  const title = `${topCategory} Improvement Plan`;
  const repSuffix = repName ? ` for ${repName}` : "";
  const description = `Auto-generated coaching plan targeting ${sorted.length} improvement areas identified from call analysis${repSuffix}. Focus on ${sorted.slice(0, 2).map(w => w.criterionName).join(" and ")}.`;

  return { title, description, items };
}

/**
 * Analyze call scores and scorecard criteria to identify weaknesses.
 * @param callScores - Array of scorecard criteria scores from call_analyses/call_scores
 * @returns Array of CallWeakness objects sorted by gap size
 */
export function analyzeWeaknesses(criteriaScores: Array<{
  criterionName: string;
  category: string;
  score: number;
  maxScore: number;
  weight: number;
}>): CallWeakness[] {
  const weaknesses: CallWeakness[] = [];

  for (const cs of criteriaScores) {
    const gap = cs.maxScore - cs.score;
    if (gap > 0) {
      weaknesses.push({
        category: cs.category || "General",
        criterionName: cs.criterionName,
        score: cs.score,
        maxScore: cs.maxScore,
        gap,
        weight: cs.weight,
      });
    }
  }

  // Sort by gap size (descending) then by weight (descending)
  return weaknesses.sort((a, b) => {
    if (b.gap !== a.gap) return b.gap - a.gap;
    return b.weight - a.weight;
  });
}