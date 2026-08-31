import { useEffect, useState, useRef, useCallback } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

import { Badge, Button, Card, CardHeader, CardTitle, Input, EmptyState, Spinner, ResponsiveTable } from "~/components/ui";
import { getCompanyCalls } from "~/utils/db";
import type { UserSession } from "~/components/layout/Header";

export const Route = createFileRoute("/dashboard/calls")({
  component: CallList,
});

function formatDuration(seconds: number): string {
  if (!seconds) return "-";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function CallList() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Upload modal state
  const [showUpload, setShowUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDirection, setUploadDirection] = useState<"inbound" | "outbound">("outbound");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [pollingId, setPollingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  // Load calls
  const loadCalls = useCallback(async () => {
    if (!user) return;
    const data = await getCompanyCalls(user.companyId);
    setCalls(data);
  }, [user]);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(async ({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      const data = await getCompanyCalls(user.companyId);
      setCalls(data);
      setLoading(false);
    });
  }, [navigate]);

  // Poll for analysis completion
  useEffect(() => {
    if (!pollingId || !user) return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const data = await getCompanyCalls(user.companyId);
        if (!active) return;
        setCalls(data);
        const updated = data.find((c: any) => c.id === pollingId);
        if (updated && updated.status === "analyzed") {
          setPollingId(null);
          setToastMsg("Call analysis complete!");
          setToastType("success");
          setTimeout(() => setToastMsg(null), 4000);
          clearInterval(interval);
        }
      } catch {
        // retry on next tick
      }
    }, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [pollingId, user]);

  // Upload handler
  const handleUpload = async () => {
    if (!uploadFile || !user) return;
    setUploading(true);
    setUploadError(null);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("direction", uploadDirection);
      formData.append("started_at", new Date().toISOString());

      setUploadProgress(40);

      const res = await fetch("/api/calls/upload", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(80);

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setUploadProgress(100);

      // Start polling for this call
      setPollingId(data.call.id);

      // Refresh the call list immediately
      const updated = await getCompanyCalls(user.companyId);
      setCalls(updated);

      // Close modal
      setShowUpload(false);
      setUploadFile(null);
      setUploadProgress(0);

      setToastMsg("Recording uploaded — analysis in progress...");
      setToastType("success");
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  // Drag/drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const f = files[0];
      if (f.type.startsWith("audio/") || /\.(mp3|wav|ogg|webm|m4a|flac)$/i.test(f.name)) {
        if (f.size > 50 * 1024 * 1024) {
          setUploadError("File too large. Max 50MB.");
          return;
        }
        setUploadFile(f);
        setUploadError(null);
      } else {
        setUploadError("Please select an audio file (MP3, WAV, OGG, WEBM, M4A, FLAC).");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const f = files[0];
      if (f.size > 50 * 1024 * 1024) {
        setUploadError("File too large. Max 50MB.");
        return;
      }
      setUploadFile(f);
      setUploadError(null);
    }
  };

  // ─── Upload Modal Render ──────────────────────────────────────
  function showUploadModal() {
    if (!showUpload) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget && !uploading) {
            setShowUpload(false);
            setUploadFile(null);
            setUploadError(null);
            setUploadProgress(0);
          }
        }}
      >
        <Card padding="none" className="w-full max-w-lg shadow-2xl">
          {/* Header */}
          <CardHeader>
            <CardTitle>Upload Call Recording</CardTitle>
            <button
              onClick={() => {
                if (!uploading) {
                  setShowUpload(false);
                  setUploadFile(null);
                  setUploadError(null);
                  setUploadProgress(0);
                }
              }}
              className="text-ink-muted hover:text-ink transition-colors"
              aria-label="Close"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </CardHeader>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* File Drop Zone */}
            <div
              ref={dropRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${
                dragging
                  ? "border-accent-500 bg-accent-500/5"
                  : uploadFile
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-edge-strong hover:border-accent-500/40 hover:bg-panel-raised/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.ogg,.webm,.m4a,.flac"
                className="hidden"
                onChange={handleFileSelect}
              />

              {uploadFile ? (
                <div className="space-y-2">
                  <span className="text-3xl">🎵</span>
                  <p className="text-sm text-ink font-medium truncate">{uploadFile.name}</p>
                  <p className="text-xs text-ink-muted">
                    {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFile(null);
                    }}
                    className="text-xs text-ink-muted hover:text-red-400 transition-colors underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-3xl">📁</span>
                  <p className="text-sm text-ink-muted">
                    <span className="text-accent-fg font-medium">Click to browse</span> or drag & drop
                  </p>
                  <p className="text-xs text-ink-faint">
                    MP3, WAV, OGG, WEBM, M4A, FLAC — max 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Direction Selector */}
            <div>
              <label className="block text-sm font-medium text-ink-muted mb-2">Direction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUploadDirection("outbound")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    uploadDirection === "outbound"
                      ? "bg-accent-500/15 text-accent-fg border border-accent-500/30"
                      : "bg-panel-raised text-ink-muted border border-edge hover:text-ink"
                  }`}
                >
                  📤 Outbound
                </button>
                <button
                  type="button"
                  onClick={() => setUploadDirection("inbound")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    uploadDirection === "inbound"
                      ? "bg-accent-500/15 text-accent-fg border border-accent-500/30"
                      : "bg-panel-raised text-ink-muted border border-edge hover:text-ink"
                  }`}
                >
                  📥 Inbound
                </button>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">
                    {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                  </span>
                  <span className="text-ink-muted">{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-panel-raised overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-accent-600 to-accent-400 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {uploadError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/25 px-4 py-3 text-sm text-red-400">
                {uploadError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-edge px-6 py-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowUpload(false);
                setUploadFile(null);
                setUploadError(null);
                setUploadProgress(0);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              loading={uploading}
            >
              Upload Recording
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <Spinner className="h-8 w-8 animate-spin text-accent-fg" />
    </div>
  );

  const filtered = search
    ? calls.filter((c) =>
        (c.rep_name || "").toLowerCase().includes(search.toLowerCase())
      )
    : calls;

  // ─── Empty State ──────────────────────────────────────────────
  if (calls.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Call Reviews</h1>
            <p className="text-sm text-ink-muted">No calls yet</p>
          </div>
        </div>

        <EmptyState
          icon={<span className="text-4xl">📞</span>}
          title="No calls yet"
          description="Connect your phone system or upload a call recording to get started. Your calls will appear here automatically once analyzed."
          action={
            <Button variant="primary" onClick={() => setShowUpload(true)} leftIcon={<span aria-hidden>⬆️</span>}>
              Upload Call Recording
            </Button>
          }
          secondaryAction={
            <Button variant="outline" href="/dashboard/integrations" leftIcon={<span aria-hidden>🔗</span>}>
              Connect Phone System
            </Button>
          }
        />

        {/* Upload Modal */}
        {showUploadModal()}
      </div>
    );
  }

  // ─── Main View ────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 rounded-xl px-5 py-3 text-sm font-medium shadow-xl backdrop-blur-xl transition-all ${
            toastType === "success"
              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25"
              : "bg-red-500/15 text-red-300 border border-red-500/25"
          }`}
          style={{ animation: "slideIn 0.3s ease-out" }}
        >
          {toastType === "success" ? "✅ " : "❌ "}
          {toastMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Call Reviews</h1>
          <p className="text-sm text-ink-muted">{calls.length} total calls analyzed</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Input
            type="text"
            placeholder="Search by rep name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<span aria-hidden>🔍</span>}
            containerClassName="flex-1 sm:flex-initial"
            className="sm:w-64"
          />
          <Button variant="primary" onClick={() => setShowUpload(true)} leftIcon={<span aria-hidden>⬆️</span>}>
            <span className="hidden sm:inline">Upload Call</span>
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-4 opacity-50">🔍</span>
          <h3 className="text-lg font-semibold text-ink mb-1">No results found</h3>
          <p className="text-sm text-ink-muted max-w-sm">No calls match "{search}". Try a different search term.</p>
        </Card>
      ) : (
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-4">
            <ResponsiveTable
              data={filtered}
              getKey={(call: any) => call.id}
              collapseAfter={3}
              columns={[
                {
                  key: "rep",
                  header: "Rep",
                  primary: true,
                  render: (call: any) => (
                    <Link
                      to="/dashboard/calls/$callId"
                      params={{ callId: call.id }}
                      className="font-medium text-ink transition-colors hover:text-accent-300"
                    >
                      {call.rep_name || "Unknown"}
                    </Link>
                  ),
                },
                {
                  key: "score",
                  header: "Score",
                  render: (call: any) => (
                    <span className={`font-semibold ${
                      call.overall_score >= 85 ? "text-emerald-400" :
                      call.overall_score >= 70 ? "text-amber-400" :
                      call.overall_score ? "text-red-400" : "text-ink-muted"
                    }`}>
                      {call.overall_score ?? "-"}
                    </span>
                  ),
                },
                {
                  key: "sentiment",
                  header: "Sentiment",
                  render: (call: any) => (
                    <Badge tone={
                      call.sentiment === "positive" ? "positive" :
                      call.sentiment === "negative" ? "negative" : "neutral"
                    }>
                      {call.sentiment || "neutral"}
                    </Badge>
                  ),
                },
                {
                  key: "status",
                  header: "Status",
                  render: (call: any) => (
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      call.status === "analyzed" ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/25" :
                      call.status === "processing" ? "bg-sky-500/10 text-sky-300 border border-sky-500/25 animate-pulse" :
                      "bg-red-500/10 text-red-300 border border-red-500/25"
                    }`}>
                      {call.status === "processing" ? (
                        <span className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-pulse" />
                          Processing
                        </span>
                      ) : call.status}
                    </span>
                  ),
                },
                {
                  key: "date",
                  header: "Date",
                  render: (call: any) => (
                    <span className="text-ink-muted">{formatDate(call.started_at)}</span>
                  ),
                },
                {
                  key: "duration",
                  header: "Duration",
                  render: (call: any) => (
                    <span className="text-ink-muted">{formatDuration(call.duration_seconds)}</span>
                  ),
                },
                {
                  key: "action",
                  header: "",
                  hideOnMobile: true,
                  render: (call: any) => (
                    <Link
                      to="/dashboard/calls/$callId"
                      params={{ callId: call.id }}
                      className="text-sm font-medium text-accent-fg hover:text-accent-400 transition-colors"
                    >
                      View →
                    </Link>
                  ),
                },
              ]}
            />
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal()}
    </div>
  );
}
