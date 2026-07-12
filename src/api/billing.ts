/**
 * Billing API handlers: plan information.
 */

import { sql } from "~/utils/sql";
import { db, jsonResponse, getAuthUser } from "./middleware";

// ─── GET /api/billing/plan ─────────────────────────────────────────────────────
export async function handleGetBillingPlan(req: Request): Promise<Response> {
  try {
    const user = await getAuthUser(req);
    if (!user) return jsonResponse({ error: "Not authenticated" }, 401);

    const rows = await db(sql`
      SELECT id, name, slug, tier, created_at FROM companies WHERE id = ${user.companyId}
    `);
    if (rows.length === 0) return jsonResponse({ error: "Company not found" }, 404);

    const company = rows[0];
    const teamSize = (await db(sql`SELECT COUNT(*) as count FROM users WHERE company_id = ${user.companyId}`))[0]?.count || 0;

    const plans = {
      core: {
        name: "Core",
        price: "$29/mo",
        stripeLink: "https://buy.stripe.com/8x2fZh4pL2Tp1sY3kw1wY02",
        features: [
          "AI call analysis",
          "Basic scorecards",
          "Manager dashboard",
          "Up to 10 team members",
          "Email support",
        ],
      },
      pro: {
        name: "Pro",
        price: "$79/mo",
        stripeLink: "https://buy.stripe.com/28E00jbSd79F1sYaMY1wY01",
        features: [
          "Everything in Core",
          "Live AI coaching",
          "AI role-playing",
          "Custom scorecards",
          "Advanced analytics",
          "Up to 50 team members",
          "Priority support",
        ],
      },
      enterprise: {
        name: "Enterprise",
        price: "$199/mo",
        stripeLink: "https://buy.stripe.com/dRmd9Rf4p65B2x23kw1wY00",
        features: [
          "Everything in Pro",
          "Multi-company admin",
          "SSO / SAML",
          "Custom AI prompts",
          "Dedicated support",
          "SLA guarantees",
          "Unlimited team members",
          "Custom integrations",
        ],
      },
    };

    return jsonResponse({
      company: { ...company, teamSize },
      currentPlan: plans[company.tier as keyof typeof plans] || plans.core,
      allPlans: plans,
    });
  } catch (e) {
    console.error("billing plan error:", e);
    return jsonResponse({ error: "Failed to load billing info" }, 500);
  }
}