/**
 * API Router — central fetch handler that dispatches to modular domain handlers.
 *
 * Import this in serve.ts and use it as the API fetch handler for all /api/* routes.
 */

import { jsonResponse, UPLOADS_DIR } from "./middleware";
import { handleLogin, handleRegister, handleLogout, handleSession } from "./auth";
import { handleDemoLogin } from "./demo-login";
import { handleWizardGetStatus, handleCompleteOnboardingStep, handleSkipOnboardingStep } from "./onboarding";
import { handleCallUpload, handleCallList, handleCallDelete } from "./calls";
import {
  handleListScorecards,
  handleCreateScorecard,
  handleUpdateScorecard,
  handleDeleteScorecard,
  handleCreateCriteria,
  handleUpdateCriteria,
  handleDeleteCriteria,
} from "./scorecards";
import { handleRoleplayScenarios, handleRoleplayStart, handleRoleplayMessage, handleRoleplayEnd, handleGenerateCoachingPlan, handleCreateManualPlan } from "./coaching";
import { handleGetCompanySettings, handleUpdateCompanySettings, handleUpdateProfile, handleChangePassword, handleGetNotifications, handleUpdateNotifications } from "./settings";
import { handleListComplianceRules, handleCreateComplianceRule, handleUpdateComplianceRule, handleDeleteComplianceRule, handleListComplianceChecks } from "./compliance";
import { handleGetBillingPlan } from "./billing";
import { handleCreateInvite, handleListInvites, handleCancelInvite } from "./team";
// ── Multi-Tenant Admin ──────────────────────────────────────────────────────────
import {
  handleAdminGetCompany,
  handleAdminUpdateCompany,
  handleAdminListUsers,
  handleAdminUpdateUser,
  handleListDepartments,
  handleCreateDepartment,
  handleUpdateDepartment,
  handleDeleteDepartment,
  handleListSubTeams,
  handleCreateSubTeam,
  handleUpdateSubTeam,
  handleDeleteSubTeam,
  handleListFeatureFlags,
  handleUpdateFeatureFlag,
  handleListAuditLogs,
  handleGetUsageMetrics,
  handleGetWhiteLabel,
  handleUpdateWhiteLabel,
} from "./admin";
import { runMigrations } from "./migrations";
// ── Live Coaching ───────────────────────────────────────────────────────────────
import {
  handleLiveCoachingStart,
  handleLiveCoachingSuggest,
  handleLiveCoachingAcknowledge,
  handleLiveCoachingEnd,
  handleLiveCoachingSessions,
  handleLiveCoachingSessionDetail,
} from "./live-coaching";
// ── Executive Analytics ─────────────────────────────────────────────────────────
import {
  handleExecutiveDashboard,
  handleExecutiveManagers,
  handleExecutiveAIInsights,
  handleAnalyticsForecast,
  handleAnalyticsExport,
  handleScheduledReports,
  handleCreateScheduledReport,
  handleDeleteScheduledReport,
} from "./analytics";
// ── Integrations & Webhooks ─────────────────────────────────────────────────────
import {
  handleListIntegrations,
  handleConnectIntegration,
  handleUpdateIntegration,
  handleDeleteIntegration,
  handleSyncIntegration,
  handleIntegrationLogs,
  handleSetIntegrationMode,
  handleListWebhooks,
  handleRegisterWebhook,
  handleUpdateWebhook,
  handleDeleteWebhook,
  handleTestWebhook,
} from "./integrations";
// ── Security ────────────────────────────────────────────────────────────────────
import { apiRateLimiter, logRequest, handleHealthCheck } from "./security";
import { handleGetOpenAIConfig, handleSaveOpenAIConfig, handleTestOpenAIConnection } from "./openai";

// ── SSO / SAML Authentication ───────────────────────────────────────────────────
import {
  handleGetSSOSettings,
  handleUpdateSSOSettings,
  handleImportIdPMetadata,
  handleGetSPMetadata,
  handleTestSAMLConnection,
  handleSAMLLogin,
  handleSAMLCallback,
  handleSAMLLogout,
} from "./sso";

// ── Notifications / Slack ───────────────────────────────────────────────────────
import {
  handleListSlackWebhooks,
  handleCreateSlackWebhook,
  handleUpdateSlackWebhook,
  handleDeleteSlackWebhook,
  handleTestSlackWebhook,
  handleGetNotificationPreferences,
  handleUpdateNotificationPreferences,
} from "./notifications";

// ── CRM Deep Sync ────────────────────────────────────────────────────────────────
import {
  handleListCrmConnections,
  handleConnectCrm,
  handleDisconnectCrm,
  handleSyncContacts,
  handleSyncDeals,
  handleSyncActivities,
  handleFullSync,
  handleCrmSyncLogs,
} from "./crm-sync";

// ── AI Manager Assistant ────────────────────────────────────────────────────────
import {
  handleDailyPriorities,
  handleRepStrengths,
  handleRepWeaknesses,
  handleCoachingRecommendations,
  handleOneOnOnePrep,
  handleCoachingHistory,
  handleListActionPlans,
  handleCreateActionPlan,
  handleGoalRecommendations,
  handleRepRiskAlerts,
  handleImprovementTracking,
  handleDailyBriefing,
} from "./manager-assistant";

// ── Advanced AI Coaching ────────────────────────────────────────────────────────
import {
  handleListPlans,
  handleCreatePlan,
  handleGetPlanDetail,
  handleUpdatePlan,
  handleSkillGaps,
  handleCreatePracticeAssignment,
  handleListPracticeAssignments,
  handleCompletePracticeAssignment,
  handleListMilestones,
  handleCreateMilestone,
  handleListIDPs,
  handleCreateIDP,
  handleConfidenceScores,
  handlePerformanceImprovement,
} from "./advanced-coaching";

// ── AI Role Play Center ────────────────────────────────────────────────────────
import {
  handleListPersonalities,
  handleCreatePersonality,
  handleListTemplates,
  handleCreateTemplate,
  handleListScenarios,
  handleCreateScenario,
  handleStartSession,
  handleTurn,
  handleGetSession,
  handleEndSession,
  handleReplayAnalysis,
  handleScorecard,
  handlePostSessionRecommendations,
  handleSessionHistory,
} from "./roleplay-center";

// ── Executive Coaching Dashboard ──────────────────────────────────────────────
import {
  handleEffectiveness,
  handleManagerEffectiveness,
  handleTeamImprovementTrends,
  handleRepDevelopment,
  handleSkillHeatmaps,
  handleCompletionRates,
  handleROI,
  handleSummaries,
  handleDepartmentComparisons,
  handleOpportunities,
} from "./executive-coaching";

// ── Coaching Academy (LMS) ───────────────────────────────────────────────────
import {
  handleListContent, handleUploadContent, handleGetContent, handleUpdateContent, handleDeleteContent,
  handleGetContentKnowledge, handleSearchKnowledgeBase,
  handleListCourses, handleCreateCourse, handleGetCourse, handleUpdateCourse, handleDeleteCourse,
  handleListQuizzes, handleCreateQuiz, handleGetQuiz, handleSubmitQuiz, handleQuizHistory,
  handleListCertifications, handleCreateCertification, handleGetCertification, handleEarnCertification,
  handleListLearningPaths, handleCreateLearningPath, handleGetLearningPath, handleEnrollLearningPath,
  handleListEnrollments, handleUpdateProgress, handleUserProgress,
  handleListAssignments, handleCreateAssignment, handleUpdateAssignment,
  handleAskKnowledge, handleKnowledgeSuggestions,
  handleLearningAnalytics, handleTeamLearningAnalytics, handleAnalyticsSkillGaps,
} from "./academy";

// ── Coaching Automation ──────────────────────────────────────────────────────
import {
  handleDailyBriefing, handleWeeklyBriefing, handleMonthlyBriefing,
  handleCreateSchedule, handleListSchedules, handleUpdateSchedule, handleDeleteSchedule,
  handleListReminders, handleCreateReminder, handleUpdateReminder,
  handleListAlerts, handleMarkAlertRead,
  handleListTasks, handleCreateTask, handleUpdateTask,
} from "./coaching-automation";

// ── Advanced Coaching Analytics ──────────────────────────────────────────────
import {
  handleRepImprovement, handleCoachingROI, handleSkillProgression, handleManagerEffectiveness,
  handlePerformanceTrends, handleTeamHeatmaps, handleAIImpact, handleBenchmarks,
  handleOpportunities, handleForecasts,
} from "./advanced-analytics";

// ── ThoughtSpot Integration ──────────────────────────────────────────────────
import {
  handleThoughtSpotConnect, handleThoughtSpotDisconnect, handleThoughtSpotSync,
  handleThoughtSpotData, handleThoughtSpotLogs,
} from "./thoughtspot";

// ── Hodu Phone System Integration ────────────────────────────────────────────
import {
  handleHoduConnect, handleHoduDisconnect, handleHoduSyncCalls, handleHoduCalls,
  handleHoduClickToDial, handleHoduLiveStream, handleHoduLogs,
} from "./hodu";

// ── Observe.ai Integration ─────────────────────────────────────────────────
import {
  handleObserveAIConnect, handleObserveAIDisconnect, handleObserveAISyncCalls,
  handleObserveAICalls, handleObserveAITranscript, handleObserveAIScores,
  handleObserveAICoaching, handleObserveAISkills, handleObserveAILogs,
} from "./observeai";

/**
 * Route all API requests to the appropriate handler.
 * Returns a Response or null if the path is not an API route.
 */
export async function routeApi(req: Request): Promise<Response | null> {
  const { pathname } = new URL(req.url);
  const startTime = Date.now();

  // ── Health Check (no auth required, no rate limit) ───────────────────────────
  if (pathname === "/api/health" && req.method === "GET") return handleHealthCheck();

  // ── Apply rate limiting to API routes ────────────────────────────────────────
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!apiRateLimiter.check(clientIp)) {
    return jsonResponse({ error: "Rate limit exceeded. Try again later." }, 429);
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────────
    if (pathname === "/api/login" && req.method === "POST") return handleLogin(req);
    if (pathname === "/api/register" && req.method === "POST") return handleRegister(req);
    if (pathname === "/api/demo-login" && req.method === "POST") return handleDemoLogin(req);
    if (pathname === "/api/logout" && req.method === "POST") return handleLogout(req);
    if (pathname === "/api/session" && req.method === "GET") return handleSession(req);

    // ── SSO / SAML ─────────────────────────────────────────────────────────────────
    // Admin SSO settings
    if (pathname === "/api/admin/sso/settings" && req.method === "GET") return handleGetSSOSettings(req);
    if (pathname === "/api/admin/sso/settings" && req.method === "PUT") return handleUpdateSSOSettings(req);
    if (pathname === "/api/admin/sso/metadata" && req.method === "POST") return handleImportIdPMetadata(req);
    if (pathname === "/api/admin/sso/metadata" && req.method === "GET") return handleGetSPMetadata(req);
    if (pathname === "/api/admin/sso/test" && req.method === "POST") return handleTestSAMLConnection(req);
    // SAML protocol endpoints (no auth — these are the SP endpoints called by IdP)
    if (pathname === "/api/auth/saml/login" && req.method === "GET") return handleSAMLLogin(req);
    if (pathname === "/api/auth/saml/callback" && (req.method === "POST" || req.method === "GET")) return handleSAMLCallback(req);
    if (pathname === "/api/auth/saml/logout" && req.method === "POST") return handleSAMLLogout(req);

    // ── Team Invitations ─────────────────────────────────────────────────────────
    if (pathname === "/api/team/invite" && req.method === "POST") return handleCreateInvite(req);
    if (pathname === "/api/team/invites" && req.method === "GET") return handleListInvites(req);
    if (pathname.startsWith("/api/team/invite/") && req.method === "DELETE") return handleCancelInvite(req);

    // ── AI Role-Play ─────────────────────────────────────────────────────────────
    if (pathname === "/api/roleplay/scenarios" && req.method === "GET") return handleRoleplayScenarios(req);
    if (pathname === "/api/roleplay/start" && req.method === "POST") return handleRoleplayStart(req);
    if (pathname === "/api/roleplay/message" && req.method === "POST") return handleRoleplayMessage(req);
    if (pathname === "/api/roleplay/end" && req.method === "POST") return handleRoleplayEnd(req);

    // ── Live Coaching ────────────────────────────────────────────────────────────
    if (pathname === "/api/coaching/live/start" && req.method === "POST") return handleLiveCoachingStart(req);
    if (pathname === "/api/coaching/live/suggest" && req.method === "POST") return handleLiveCoachingSuggest(req);
    if (pathname === "/api/coaching/live/acknowledge" && req.method === "POST") return handleLiveCoachingAcknowledge(req);
    if (pathname === "/api/coaching/live/end" && req.method === "POST") return handleLiveCoachingEnd(req);
    if (pathname === "/api/coaching/live/sessions" && req.method === "GET") return handleLiveCoachingSessions(req);
    if (pathname.startsWith("/api/coaching/live/session/") && req.method === "GET") return handleLiveCoachingSessionDetail(req);

    // ── Coaching Plan Generator ──────────────────────────────────────────────────
    if (pathname === "/api/coaching/generate" && req.method === "POST") return handleGenerateCoachingPlan(req);
    if (pathname === "/api/coaching/create" && req.method === "POST") return handleCreateManualPlan(req);

    // ── Call Recording ───────────────────────────────────────────────────────────
    if (pathname === "/api/calls/upload" && req.method === "POST") return handleCallUpload(req);
    if (pathname === "/api/calls" && req.method === "GET") return handleCallList(req);
    if (pathname.startsWith("/api/calls/") && req.method === "DELETE" && pathname.split("/").length === 4) return handleCallDelete(req);

    // ── Scorecards ───────────────────────────────────────────────────────────────
    if (pathname === "/api/scorecards" && req.method === "GET") return handleListScorecards(req);
    if (pathname === "/api/scorecards" && req.method === "POST") return handleCreateScorecard(req);
    if (pathname.startsWith("/api/scorecards/") && pathname.endsWith("/criteria") && req.method === "POST") return handleCreateCriteria(req);
    if (pathname.match(/^\/api\/scorecards\/[^/]+\/criteria\/[^/]+$/) && req.method === "PUT") return handleUpdateCriteria(req);
    if (pathname.match(/^\/api\/scorecards\/[^/]+\/criteria\/[^/]+$/) && req.method === "DELETE") return handleDeleteCriteria(req);
    if (pathname.startsWith("/api/scorecards/") && pathname.split("/").length === 4 && req.method === "PUT") return handleUpdateScorecard(req);
    if (pathname.startsWith("/api/scorecards/") && pathname.split("/").length === 4 && req.method === "DELETE") return handleDeleteScorecard(req);

    // ── Billing ──────────────────────────────────────────────────────────────────
    if (pathname === "/api/billing/plan" && req.method === "GET") return handleGetBillingPlan(req);

    // ── Settings ─────────────────────────────────────────────────────────────────
    if (pathname === "/api/settings/company" && req.method === "GET") return handleGetCompanySettings(req);
    if (pathname === "/api/settings/company" && req.method === "PUT") return handleUpdateCompanySettings(req);
    if (pathname === "/api/settings/profile" && req.method === "PUT") return handleUpdateProfile(req);
    if (pathname === "/api/settings/password" && req.method === "PUT") return handleChangePassword(req);
    if (pathname === "/api/settings/notifications" && req.method === "GET") return handleGetNotifications(req);
    if (pathname === "/api/settings/notifications" && req.method === "PUT") return handleUpdateNotifications(req);

    // Demo mode routes have been removed — everything defaults to live mode.

    // ── Onboarding Wizard ─────────────────────────────────────────────────────────
    if (pathname === "/api/onboarding/status" && req.method === "GET") return handleWizardGetStatus(req);
    if (pathname.match(/^\/api\/onboarding\/step\/[a-z_]+$/) && req.method === "POST") return handleCompleteOnboardingStep(req);
    if (pathname.match(/^\/api\/onboarding\/skip\/[a-z_]+$/) && req.method === "POST") return handleSkipOnboardingStep(req);

    // ── Notifications / Slack Webhooks ────────────────────────────────────────────
    if (pathname === "/api/notifications/preferences" && req.method === "GET") return handleGetNotificationPreferences(req);
    if (pathname === "/api/notifications/preferences" && req.method === "PUT") return handleUpdateNotificationPreferences(req);
    if (pathname === "/api/notifications/slack" && req.method === "GET") return handleListSlackWebhooks(req);
    if (pathname === "/api/notifications/slack" && req.method === "POST") return handleCreateSlackWebhook(req);
    if (pathname.match(/^\/api\/notifications\/slack\/[^/]+\/test$/) && req.method === "POST") return handleTestSlackWebhook(req);
    if (pathname.match(/^\/api\/notifications\/slack\/[^/]+$/) && req.method === "PUT") return handleUpdateSlackWebhook(req);
    if (pathname.match(/^\/api\/notifications\/slack\/[^/]+$/) && req.method === "DELETE") return handleDeleteSlackWebhook(req);

    // ── Compliance ───────────────────────────────────────────────────────────────
    if (pathname === "/api/compliance/rules" && req.method === "GET") return handleListComplianceRules(req);
    if (pathname === "/api/compliance/rules" && req.method === "POST") return handleCreateComplianceRule(req);
    if (pathname.startsWith("/api/compliance/rules/") && req.method === "PUT") return handleUpdateComplianceRule(req);
    if (pathname.startsWith("/api/compliance/rules/") && req.method === "DELETE") return handleDeleteComplianceRule(req);
    if (pathname === "/api/compliance/checks" && req.method === "GET") return handleListComplianceChecks(req);

    // ── Multi-Tenant Admin ───────────────────────────────────────────────────────
    if (pathname === "/api/admin/company" && req.method === "GET") return handleAdminGetCompany(req);
    if (pathname === "/api/admin/company" && req.method === "PUT") return handleAdminUpdateCompany(req);
    if (pathname === "/api/admin/users" && req.method === "GET") return handleAdminListUsers(req);
    if (pathname.match(/^\/api\/admin\/users\/[^/]+$/) && req.method === "PUT") return handleAdminUpdateUser(req);
    // Departments
    if (pathname === "/api/admin/departments" && req.method === "GET") return handleListDepartments(req);
    if (pathname === "/api/admin/departments" && req.method === "POST") return handleCreateDepartment(req);
    if (pathname.match(/^\/api\/admin\/departments\/[^/]+$/) && req.method === "PUT") return handleUpdateDepartment(req);
    if (pathname.match(/^\/api\/admin\/departments\/[^/]+$/) && req.method === "DELETE") return handleDeleteDepartment(req);
    // Sub-Teams
    if (pathname === "/api/admin/sub-teams" && req.method === "GET") return handleListSubTeams(req);
    if (pathname === "/api/admin/sub-teams" && req.method === "POST") return handleCreateSubTeam(req);
    if (pathname.match(/^\/api\/admin\/sub-teams\/[^/]+$/) && req.method === "PUT") return handleUpdateSubTeam(req);
    if (pathname.match(/^\/api\/admin\/sub-teams\/[^/]+$/) && req.method === "DELETE") return handleDeleteSubTeam(req);
    // Feature Flags
    if (pathname === "/api/admin/feature-flags" && req.method === "GET") return handleListFeatureFlags(req);
    if (pathname === "/api/admin/feature-flags" && req.method === "PUT") return handleUpdateFeatureFlag(req);
    // Audit Logs
    if (pathname === "/api/admin/audit-logs" && req.method === "GET") return handleListAuditLogs(req);
    // Usage Metrics
    if (pathname === "/api/admin/usage" && req.method === "GET") return handleGetUsageMetrics(req);
    // White Label
    if (pathname === "/api/admin/white-label" && req.method === "GET") return handleGetWhiteLabel(req);
    if (pathname === "/api/admin/white-label" && req.method === "PUT") return handleUpdateWhiteLabel(req);

    // ── Executive Analytics ──────────────────────────────────────────────────────
    if (pathname === "/api/analytics/executive" && req.method === "GET") return handleExecutiveDashboard(req);
    if (pathname === "/api/analytics/executive/managers" && req.method === "GET") return handleExecutiveManagers(req);
    if (pathname === "/api/analytics/executive/ai-insights" && req.method === "GET") return handleExecutiveAIInsights(req);
    if (pathname === "/api/analytics/forecast" && req.method === "GET") return handleAnalyticsForecast(req);
    if (pathname === "/api/analytics/export" && req.method === "GET") return handleAnalyticsExport(req);
    // Scheduled Reports
    if (pathname === "/api/analytics/reports/scheduled" && req.method === "GET") return handleScheduledReports(req);
    if (pathname === "/api/analytics/reports/schedule" && req.method === "POST") return handleCreateScheduledReport(req);
    if (pathname.match(/^\/api\/analytics\/reports\/schedule\/[^/]+$/) && req.method === "DELETE") return handleDeleteScheduledReport(req);

    // ── Integrations ─────────────────────────────────────────────────────────────
    if (pathname === "/api/integrations" && req.method === "GET") return handleListIntegrations(req);
    if (pathname === "/api/integrations/connect" && req.method === "POST") return handleConnectIntegration(req);
    if (pathname.match(/^\/api\/integrations\/[^/]+\/sync$/) && req.method === "POST") return handleSyncIntegration(req);
    if (pathname.match(/^\/api\/integrations\/[^/]+\/logs$/) && req.method === "GET") return handleIntegrationLogs(req);
    if (pathname.match(/^\/api\/integrations\/[^/]+$/) && req.method === "PUT") return handleUpdateIntegration(req);
    if (pathname.match(/^\/api\/integrations\/[^/]+$/) && req.method === "DELETE") return handleDeleteIntegration(req);
    if (pathname.match(/^\/api\/integrations\/[^/]+\/mode$/) && req.method === "PUT") return handleSetIntegrationMode(req);

    // ── CRM Deep Sync ─────────────────────────────────────────────────────────────
    if (pathname === "/api/crm/connections" && req.method === "GET") return handleListCrmConnections(req);
    if (pathname === "/api/crm/connect" && req.method === "POST") return handleConnectCrm(req);
    if (pathname === "/api/crm/disconnect" && req.method === "POST") return handleDisconnectCrm(req);
    if (pathname === "/api/crm/sync/contacts" && req.method === "POST") return handleSyncContacts(req);
    if (pathname === "/api/crm/sync/deals" && req.method === "POST") return handleSyncDeals(req);
    if (pathname === "/api/crm/sync/activities" && req.method === "POST") return handleSyncActivities(req);
    if (pathname === "/api/crm/sync/full" && req.method === "POST") return handleFullSync(req);
    if (pathname === "/api/crm/sync/logs" && req.method === "GET") return handleCrmSyncLogs(req);

    // ── Webhooks ────────────────────────────────────────────────────────────────
    if (pathname === "/api/webhooks" && req.method === "GET") return handleListWebhooks(req);
    if (pathname === "/api/webhooks/register" && req.method === "POST") return handleRegisterWebhook(req);
    if (pathname === "/api/webhooks/test" && req.method === "POST") return handleTestWebhook(req);
    if (pathname.match(/^\/api\/webhooks\/[^/]+$/) && req.method === "PUT") return handleUpdateWebhook(req);
    if (pathname.match(/^\/api\/webhooks\/[^/]+$/) && req.method === "DELETE") return handleDeleteWebhook(req);

    // ── Migrations (admin) ───────────────────────────────────────────────────────
    if (pathname === "/api/admin/migrate" && req.method === "POST") {
      await runMigrations();
      return jsonResponse({ success: true, message: "Migrations completed" });
    }

    // ── AI Manager Assistant ─────────────────────────────────────────────────────
    if (pathname === "/api/manager-assistant/daily-priorities" && req.method === "GET") return handleDailyPriorities(req);
    if (pathname.match(/^\/api\/manager-assistant\/rep-strengths\/[^/]+$/) && req.method === "GET") return handleRepStrengths(req);
    if (pathname.match(/^\/api\/manager-assistant\/rep-weaknesses\/[^/]+$/) && req.method === "GET") return handleRepWeaknesses(req);
    if (pathname === "/api/manager-assistant/coaching-recommendations" && req.method === "GET") return handleCoachingRecommendations(req);
    if (pathname.match(/^\/api\/manager-assistant\/one-on-one-prep\/[^/]+$/) && req.method === "GET") return handleOneOnOnePrep(req);
    if (pathname.match(/^\/api\/manager-assistant\/coaching-history\/[^/]+$/) && req.method === "GET") return handleCoachingHistory(req);
    if (pathname === "/api/manager-assistant/action-plans" && req.method === "GET") return handleListActionPlans(req);
    if (pathname === "/api/manager-assistant/action-plans" && req.method === "POST") return handleCreateActionPlan(req);
    if (pathname === "/api/manager-assistant/goal-recommendations" && req.method === "GET") return handleGoalRecommendations(req);
    if (pathname === "/api/manager-assistant/rep-risk-alerts" && req.method === "GET") return handleRepRiskAlerts(req);
    if (pathname.match(/^\/api\/manager-assistant\/improvement-tracking\/[^/]+$/) && req.method === "GET") return handleImprovementTracking(req);
    if (pathname === "/api/manager-assistant/daily-briefing" && req.method === "GET") return handleDailyBriefing(req);

    // ── Advanced AI Coaching ──────────────────────────────────────────────────────
    if (pathname === "/api/advanced-coaching/plans" && req.method === "GET") return handleListPlans(req);
    if (pathname === "/api/advanced-coaching/plans" && req.method === "POST") return handleCreatePlan(req);
    if (pathname.match(/^\/api\/advanced-coaching\/plans\/[^/]+$/) && req.method === "GET") return handleGetPlanDetail(req);
    if (pathname.match(/^\/api\/advanced-coaching\/plans\/[^/]+$/) && req.method === "PUT") return handleUpdatePlan(req);
    if (pathname.match(/^\/api\/advanced-coaching\/skill-gaps\/[^/]+$/) && req.method === "GET") return handleSkillGaps(req);
    if (pathname === "/api/advanced-coaching/practice-assignments" && req.method === "POST") return handleCreatePracticeAssignment(req);
    if (pathname === "/api/advanced-coaching/practice-assignments" && req.method === "GET") return handleListPracticeAssignments(req);
    if (pathname.match(/^\/api\/advanced-coaching\/practice-assignments\/[^/]+\/complete$/) && req.method === "POST") return handleCompletePracticeAssignment(req);
    if (pathname.match(/^\/api\/advanced-coaching\/coaching-milestones\/[^/]+$/) && req.method === "GET") return handleListMilestones(req);
    if (pathname === "/api/advanced-coaching/coaching-milestones" && req.method === "POST") return handleCreateMilestone(req);
    if (pathname === "/api/advanced-coaching/idps" && req.method === "GET") return handleListIDPs(req);
    if (pathname === "/api/advanced-coaching/idps" && req.method === "POST") return handleCreateIDP(req);
    if (pathname.match(/^\/api\/advanced-coaching\/confidence-scores\/[^/]+$/) && req.method === "GET") return handleConfidenceScores(req);
    if (pathname.match(/^\/api\/advanced-coaching\/performance-improvement\/[^/]+$/) && req.method === "GET") return handlePerformanceImprovement(req);

    // ── AI Role Play Center ──────────────────────────────────────────────────────
    if (pathname === "/api/roleplay-center/personalities" && req.method === "GET") return handleListPersonalities(req);
    if (pathname === "/api/roleplay-center/personalities" && req.method === "POST") return handleCreatePersonality(req);
    if (pathname === "/api/roleplay-center/templates" && req.method === "GET") return handleListTemplates(req);
    if (pathname === "/api/roleplay-center/templates" && req.method === "POST") return handleCreateTemplate(req);
    if (pathname === "/api/roleplay-center/scenarios" && req.method === "GET") return handleListScenarios(req);
    if (pathname === "/api/roleplay-center/scenarios" && req.method === "POST") return handleCreateScenario(req);
    if (pathname === "/api/roleplay-center/sessions/start" && req.method === "POST") return handleStartSession(req);
    if (pathname.match(/^\/api\/roleplay-center\/sessions\/[^/]+\/turn$/) && req.method === "POST") return handleTurn(req);
    if (pathname.match(/^\/api\/roleplay-center\/sessions\/[^/]+\/end$/) && req.method === "POST") return handleEndSession(req);
    if (pathname.match(/^\/api\/roleplay-center\/sessions\/[^/]+\/replay$/) && req.method === "GET") return handleReplayAnalysis(req);
    if (pathname.match(/^\/api\/roleplay-center\/sessions\/[^/]+\/scorecard$/) && req.method === "GET") return handleScorecard(req);
    if (pathname.match(/^\/api\/roleplay-center\/sessions\/[^/]+\/recommendations$/) && req.method === "GET") return handlePostSessionRecommendations(req);
    if (pathname.match(/^\/api\/roleplay-center\/sessions\/[^/]+$/) && req.method === "GET") return handleGetSession(req);
    if (pathname === "/api/roleplay-center/history" && req.method === "GET") return handleSessionHistory(req);

    // ── Executive Coaching Dashboard ─────────────────────────────────────────────
    if (pathname === "/api/executive-coaching/effectiveness" && req.method === "GET") return handleEffectiveness(req);
    if (pathname === "/api/executive-coaching/manager-effectiveness" && req.method === "GET") return handleManagerEffectiveness(req);
    if (pathname === "/api/executive-coaching/team-improvement-trends" && req.method === "GET") return handleTeamImprovementTrends(req);
    if (pathname.match(/^\/api\/executive-coaching\/rep-development\/[^/]+$/) && req.method === "GET") return handleRepDevelopment(req);
    if (pathname === "/api/executive-coaching/skill-heatmaps" && req.method === "GET") return handleSkillHeatmaps(req);
    if (pathname === "/api/executive-coaching/completion-rates" && req.method === "GET") return handleCompletionRates(req);
    if (pathname === "/api/executive-coaching/roi" && req.method === "GET") return handleROI(req);
    if (pathname === "/api/executive-coaching/summaries" && req.method === "GET") return handleSummaries(req);
    if (pathname === "/api/executive-coaching/department-comparisons" && req.method === "GET") return handleDepartmentComparisons(req);
    if (pathname === "/api/executive-coaching/opportunities" && req.method === "GET") return handleOpportunities(req);

    // ── Coaching Academy (LMS) ───────────────────────────────────────────────────
    // Content Library
    if (pathname === "/api/academy/content" && req.method === "GET") return handleListContent(req);
    if (pathname === "/api/academy/content/upload" && req.method === "POST") return handleUploadContent(req);
    if (pathname.match(/^\/api\/academy\/content\/[^/]+\/knowledge$/) && req.method === "GET") return handleGetContentKnowledge(req);
    if (pathname.match(/^\/api\/academy\/content\/[^/]+$/) && req.method === "GET") return handleGetContent(req);
    if (pathname.match(/^\/api\/academy\/content\/[^/]+$/) && req.method === "PUT") return handleUpdateContent(req);
    if (pathname.match(/^\/api\/academy\/content\/[^/]+$/) && req.method === "DELETE") return handleDeleteContent(req);
    if (pathname === "/api/academy/knowledge-base" && req.method === "GET") return handleSearchKnowledgeBase(req);
    // Courses
    if (pathname === "/api/academy/courses" && req.method === "GET") return handleListCourses(req);
    if (pathname === "/api/academy/courses" && req.method === "POST") return handleCreateCourse(req);
    if (pathname.match(/^\/api\/academy\/courses\/[^/]+$/) && req.method === "GET") return handleGetCourse(req);
    if (pathname.match(/^\/api\/academy\/courses\/[^/]+$/) && req.method === "PUT") return handleUpdateCourse(req);
    if (pathname.match(/^\/api\/academy\/courses\/[^/]+$/) && req.method === "DELETE") return handleDeleteCourse(req);
    // Quizzes
    if (pathname === "/api/academy/quizzes" && req.method === "GET") return handleListQuizzes(req);
    if (pathname === "/api/academy/quizzes" && req.method === "POST") return handleCreateQuiz(req);
    if (pathname.match(/^\/api\/academy\/quizzes\/[^/]+\/submit$/) && req.method === "POST") return handleSubmitQuiz(req);
    if (pathname.match(/^\/api\/academy\/quizzes\/[^/]+\/history$/) && req.method === "GET") return handleQuizHistory(req);
    if (pathname.match(/^\/api\/academy\/quizzes\/[^/]+$/) && req.method === "GET") return handleGetQuiz(req);
    // Certifications
    if (pathname === "/api/academy/certifications" && req.method === "GET") return handleListCertifications(req);
    if (pathname === "/api/academy/certifications" && req.method === "POST") return handleCreateCertification(req);
    if (pathname.match(/^\/api\/academy\/certifications\/[^/]+\/earn$/) && req.method === "POST") return handleEarnCertification(req);
    if (pathname.match(/^\/api\/academy\/certifications\/[^/]+$/) && req.method === "GET") return handleGetCertification(req);
    // Learning Paths
    if (pathname === "/api/academy/learning-paths" && req.method === "GET") return handleListLearningPaths(req);
    if (pathname === "/api/academy/learning-paths" && req.method === "POST") return handleCreateLearningPath(req);
    if (pathname.match(/^\/api\/academy\/learning-paths\/[^/]+\/enroll$/) && req.method === "POST") return handleEnrollLearningPath(req);
    if (pathname.match(/^\/api\/academy\/learning-paths\/[^/]+$/) && req.method === "GET") return handleGetLearningPath(req);
    // Enrollments & Progress
    if (pathname === "/api/academy/enrollments" && req.method === "GET") return handleListEnrollments(req);
    if (pathname.match(/^\/api\/academy\/enrollments\/[^/]+\/update-progress$/) && req.method === "POST") return handleUpdateProgress(req);
    if (pathname.match(/^\/api\/academy\/progress\/[^/]+$/) && req.method === "GET") return handleUserProgress(req);
    // Assignments
    if (pathname === "/api/academy/assignments" && req.method === "GET") return handleListAssignments(req);
    if (pathname === "/api/academy/assignments" && req.method === "POST") return handleCreateAssignment(req);
    if (pathname.match(/^\/api\/academy\/assignments\/[^/]+$/) && req.method === "PUT") return handleUpdateAssignment(req);
    // AI Knowledge Assistant
    if (pathname === "/api/academy/knowledge/ask" && req.method === "POST") return handleAskKnowledge(req);
    if (pathname === "/api/academy/knowledge/suggestions" && req.method === "GET") return handleKnowledgeSuggestions(req);
    // Learning Analytics
    if (pathname === "/api/academy/analytics" && req.method === "GET") return handleLearningAnalytics(req);
    if (pathname.match(/^\/api\/academy\/analytics\/team\/[^/]+$/) && req.method === "GET") return handleTeamLearningAnalytics(req);
    if (pathname === "/api/academy/analytics/skill-gaps" && req.method === "GET") return handleAnalyticsSkillGaps(req);

    // ── Coaching Automation ─────────────────────────────────────────────────────
    if (pathname === "/api/coaching-automation/briefings/daily" && req.method === "GET") return handleDailyBriefing(req);
    if (pathname === "/api/coaching-automation/briefings/weekly" && req.method === "GET") return handleWeeklyBriefing(req);
    if (pathname === "/api/coaching-automation/briefings/monthly" && req.method === "GET") return handleMonthlyBriefing(req);
    if (pathname === "/api/coaching-automation/schedules" && req.method === "POST") return handleCreateSchedule(req);
    if (pathname === "/api/coaching-automation/schedules" && req.method === "GET") return handleListSchedules(req);
    if (pathname.match(/^\/api\/coaching-automation\/schedules\/[^/]+$/) && req.method === "PUT") return handleUpdateSchedule(req);
    if (pathname.match(/^\/api\/coaching-automation\/schedules\/[^/]+$/) && req.method === "DELETE") return handleDeleteSchedule(req);
    if (pathname === "/api/coaching-automation/reminders" && req.method === "GET") return handleListReminders(req);
    if (pathname === "/api/coaching-automation/reminders" && req.method === "POST") return handleCreateReminder(req);
    if (pathname.match(/^\/api\/coaching-automation\/reminders\/[^/]+$/) && req.method === "PUT") return handleUpdateReminder(req);
    if (pathname === "/api/coaching-automation/alerts" && req.method === "GET") return handleListAlerts(req);
    if (pathname.match(/^\/api\/coaching-automation\/alerts\/[^/]+\/read$/) && req.method === "POST") return handleMarkAlertRead(req);
    if (pathname === "/api/coaching-automation/tasks" && req.method === "GET") return handleListTasks(req);
    if (pathname === "/api/coaching-automation/tasks" && req.method === "POST") return handleCreateTask(req);
    if (pathname.match(/^\/api\/coaching-automation\/tasks\/[^/]+$/) && req.method === "PUT") return handleUpdateTask(req);

    // ── Advanced Coaching Analytics ─────────────────────────────────────────────
    if (pathname.match(/^\/api\/advanced-analytics\/rep-improvement\/[^/]+$/) && req.method === "GET") return handleRepImprovement(req);
    if (pathname === "/api/advanced-analytics/coaching-roi" && req.method === "GET") return handleCoachingROI(req);
    if (pathname.match(/^\/api\/advanced-analytics\/skill-progression\/[^/]+$/) && req.method === "GET") return handleSkillProgression(req);
    if (pathname === "/api/advanced-analytics/manager-effectiveness" && req.method === "GET") return handleManagerEffectiveness(req);
    if (pathname.match(/^\/api\/advanced-analytics\/performance-trends\/[^/]+$/) && req.method === "GET") return handlePerformanceTrends(req);
    if (pathname === "/api/advanced-analytics/team-heatmaps" && req.method === "GET") return handleTeamHeatmaps(req);
    if (pathname === "/api/advanced-analytics/ai-impact" && req.method === "GET") return handleAIImpact(req);
    if (pathname === "/api/advanced-analytics/benchmarks" && req.method === "GET") return handleBenchmarks(req);
    if (pathname === "/api/advanced-analytics/opportunities" && req.method === "GET") return handleOpportunities(req);
    if (pathname === "/api/advanced-analytics/forecasts" && req.method === "GET") return handleForecasts(req);

    // ── ThoughtSpot Integration ─────────────────────────────────────────────────
    if (pathname === "/api/integrations/thoughtspot/connect" && req.method === "POST") return handleThoughtSpotConnect(req);
    if (pathname === "/api/integrations/thoughtspot/disconnect" && req.method === "POST") return handleThoughtSpotDisconnect(req);
    if (pathname === "/api/integrations/thoughtspot/sync" && req.method === "POST") return handleThoughtSpotSync(req);
    if (pathname === "/api/integrations/thoughtspot/data" && req.method === "GET") return handleThoughtSpotData(req);
    if (pathname === "/api/integrations/thoughtspot/logs" && req.method === "GET") return handleThoughtSpotLogs(req);

    // ── Hodu Phone System Integration ───────────────────────────────────────────
    if (pathname === "/api/integrations/hodu/connect" && req.method === "POST") return handleHoduConnect(req);
    if (pathname === "/api/integrations/hodu/disconnect" && req.method === "POST") return handleHoduDisconnect(req);
    if (pathname === "/api/integrations/hodu/sync-calls" && req.method === "POST") return handleHoduSyncCalls(req);
    if (pathname === "/api/integrations/hodu/calls" && req.method === "GET") return handleHoduCalls(req);
    if (pathname === "/api/integrations/hodu/click-to-dial" && req.method === "POST") return handleHoduClickToDial(req);
    if (pathname === "/api/integrations/hodu/live-stream" && req.method === "POST") return handleHoduLiveStream(req);
    if (pathname === "/api/integrations/hodu/logs" && req.method === "GET") return handleHoduLogs(req);

    // ── Observe.ai Integration ──────────────────────────────────────────────────
    if (pathname === "/api/integrations/observeai/connect" && req.method === "POST") return handleObserveAIConnect(req);
    if (pathname === "/api/integrations/observeai/disconnect" && req.method === "POST") return handleObserveAIDisconnect(req);
    if (pathname === "/api/integrations/observeai/sync-calls" && req.method === "POST") return handleObserveAISyncCalls(req);
    if (pathname === "/api/integrations/observeai/calls" && req.method === "GET") return handleObserveAICalls(req);
    if (pathname === "/api/integrations/observeai/transcript" && req.method === "GET") return handleObserveAITranscript(req);
    if (pathname === "/api/integrations/observeai/scores" && req.method === "GET") return handleObserveAIScores(req);
    if (pathname === "/api/integrations/observeai/coaching" && req.method === "GET") return handleObserveAICoaching(req);
    if (pathname === "/api/integrations/observeai/skills" && req.method === "GET") return handleObserveAISkills(req);
    if (pathname === "/api/integrations/observeai/logs" && req.method === "GET") return handleObserveAILogs(req);

    // ── OpenAI Configuration ──────────────────────────────────────────────────────
    if (pathname === "/api/openai/config" && req.method === "GET") return handleGetOpenAIConfig(req);
    if (pathname === "/api/openai/config" && req.method === "PUT") return handleSaveOpenAIConfig(req);
    if (pathname === "/api/openai/test" && req.method === "POST") return handleTestOpenAIConnection(req);

    // Catch-all for unmatched /api/* routes — return JSON instead of HTML
    if (pathname.startsWith("/api/")) {
      return jsonResponse({ error: "API endpoint not found" }, 404);
    }
    // Not an API route
    return null;
  } finally {
    const duration = Date.now() - startTime;
    logRequest(req, duration > 0 ? 200 : 500, duration);
  }
}

/**
 * Handle serving uploaded files from the /uploads/ directory.
 * Returns a Response or null if the file doesn't exist.
 */
export async function serveUploadedFile(pathname: string): Promise<Response | null> {
  if (!pathname.startsWith("/uploads/")) return null;
  const filePath = `${UPLOADS_DIR}/${pathname.slice(9)}`;
  const file = Bun.file(filePath);
  if (await file.exists()) return new Response(file);
  return null;
}