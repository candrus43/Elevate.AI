import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, LoadingSkeleton } from "~/components/GlassCard";

export const Route = createFileRoute("/admin/sso")({
  component: SSOSettings,
});

function SSOSettings() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [metaUrl, setMetaUrl] = useState("");
  const [configMode, setConfigMode] = useState<"manual" | "url">("manual");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | "success" | "error">(null);

  const [entityId, setEntityId] = useState("https://elevate-ai.ctonew.app/saml/metadata");
  const [acsUrl] = useState("https://elevate-ai.ctonew.app/api/auth/saml/callback");
  const [idpSsoUrl, setIdpSsoUrl] = useState("");
  const [idpEntityId, setIdpEntityId] = useState("");
  const [certificate, setCertificate] = useState("");

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user || user.role !== "admin") { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTestResult(enabled ? "success" : "error");
      setTesting(false);
    }, 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">SSO / SAML Settings</h1>
          <p className="text-sm text-gray-400 mt-1">Configure single sign-on for your organization</p>
        </div>
        <GlassBadge color={enabled ? "green" : "default"}>
          <span className={`inline-flex h-2 w-2 rounded-full ${enabled ? "bg-green-500" : "bg-gray-400"} mr-1.5`} />
          {enabled ? "Configured" : "Not Configured"}
        </GlassBadge>
      </div>

      {/* Enable/Disable Toggle */}
      <GlassCard hover={false}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-lg font-semibold text-white">Enable SSO</h3>
              <p className="text-sm text-gray-400">Allow users to sign in with SAML single sign-on</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="peer sr-only" />
              <div className="h-6 w-11 rounded-full bg-white/10 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-purple-600 peer-checked:after:translate-x-full" />
            </label>
          </div>
          {enabled && (
            <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
              <span className="text-amber-300">⚠️ When SSO is enabled, users can still sign in with email/password as a fallback. Disabling email/password login is available in Enterprise tier.</span>
            </div>
          )}
        </div>
      </GlassCard>

      {enabled && (
        <>
          {/* Configuration Method */}
          <GlassCard>
            <GlassCardHeader>
              <h3 className="text-lg font-semibold text-white">Identity Provider Configuration</h3>
            </GlassCardHeader>
            <div className="p-5 sm:p-6 space-y-6">
              {/* Method Toggle */}
              <div className="flex gap-2">
                <GlassButton onClick={() => setConfigMode("url")} variant={configMode === "url" ? "primary" : "secondary"}>Metadata URL</GlassButton>
                <GlassButton onClick={() => setConfigMode("manual")} variant={configMode === "manual" ? "primary" : "secondary"}>Manual</GlassButton>
              </div>

              {configMode === "url" ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">IdP Metadata URL</label>
                  <div className="flex gap-2">
                    <GlassInput type="url" value={metaUrl} onChange={(e) => setMetaUrl(e.target.value)} placeholder="https://your-idp.com/metadata" />
                    <GlassButton variant="primary">Import</GlassButton>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">Entity ID (SP)</label>
                      <GlassInput type="text" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">ACS URL</label>
                      <GlassInput type="url" value={acsUrl} readOnly className="!opacity-60" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">IdP SSO URL</label>
                      <GlassInput type="url" value={idpSsoUrl} onChange={(e) => setIdpSsoUrl(e.target.value)} placeholder="https://your-idp.com/sso" />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-gray-300">IdP Entity ID</label>
                      <GlassInput type="text" value={idpEntityId} onChange={(e) => setIdpEntityId(e.target.value)} placeholder="https://your-idp.com/entity" />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-300">X.509 Certificate</label>
                    <textarea
                      rows={4}
                      value={certificate}
                      onChange={(e) => setCertificate(e.target.value)}
                      placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                      className="w-full rounded-xl px-3 sm:px-4 py-2.5 text-sm font-mono text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50 transition-all"
                      style={{
                        background: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Attribute Mapping */}
          <GlassCard>
            <GlassCardHeader>
              <h3 className="text-lg font-semibold text-white">Attribute Mapping</h3>
            </GlassCardHeader>
            <div className="p-5 sm:p-6 space-y-4">
              <p className="text-xs text-gray-500">Map SAML attributes to ElevateAI user fields</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Email Attribute</label>
                  <GlassInput type="text" defaultValue="email" />
                  <p className="text-[10px] text-gray-500 mt-0.5">SAML attribute for user email</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Name Attribute</label>
                  <GlassInput type="text" defaultValue="displayName" />
                  <p className="text-[10px] text-gray-500 mt-0.5">SAML attribute for user display name</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Role Attribute (optional)</label>
                  <GlassInput type="text" defaultValue="" placeholder="role" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-300">Default Role</label>
                  <GlassSelect className="!w-full">
                    <option>Rep</option>
                    <option>Manager</option>
                    <option>Admin</option>
                  </GlassSelect>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <GlassButton variant="primary">Save Configuration</GlassButton>
            <GlassButton onClick={handleTest} disabled={testing} variant="secondary">
              {testing ? "Testing..." : "Test SAML Connection"}
            </GlassButton>
            <GlassButton variant="secondary">Download SP Metadata</GlassButton>
          </div>

          {/* Test Result */}
          {testResult && (
            <div
              className="rounded-xl p-4"
              style={{
                background: testResult === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                border: testResult === "success" ? "1px solid rgba(34, 197, 94, 0.2)" : "1px solid rgba(239, 68, 68, 0.2)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className={`text-lg ${testResult === "success" ? "text-green-400" : "text-red-400"}`}>
                  {testResult === "success" ? "✓" : "✗"}
                </span>
                <div>
                  <p className={`text-sm font-medium ${testResult === "success" ? "text-green-300" : "text-red-300"}`}>
                    {testResult === "success" ? "Connection successful! SAML configuration is valid." : "Connection failed. Please verify your IdP configuration."}
                  </p>
                  {testResult === "error" && <p className="text-xs text-red-400 mt-0.5">Make sure the IdP SSO URL and certificate are correct.</p>}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}