import { LoadingSkeleton } from '~/components/GlassCard';
import { EmptyState } from '~/components/GlassCard';
import { useEffect, useState, useRef, useCallback } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

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

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <LoadingSkeleton className="h-8 w-8 rounded-full" />
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
            <h1 className="text-2xl font-bold text-white">Call Reviews</h1>
            <p className="text-sm text-gray-400">No calls yet</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <span className="text-4xl mb-4 opacity-50">📞</span>
          <h3 className="text-lg font-semibold text-white mb-1">No calls yet</h3>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            Connect your phone system or upload a call recording to get started.
            Your calls will appear here automatically once analyzed.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowUpload(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-xl"
            >
              <span>⬆️</span>
              Upload Call Recording
            </button>
            <a
              href="/dashboard/integrations"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition-all hover:text-white hover:border-white/20"
            >
              <span>🔗</span>
              Connect Phone System
            </a>
          </div>
        </div>

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
              ? "bg-green-900/80 text-green-200 border border-green-500/20"
              : "bg-red-900/80 text-red-200 border border-red-500/20"
          }`}
          style={{ animation: "slideIn 0.3s ease-out" }}
        >
          {toastType === "success" ? "✅ " : "❌ "}
          {toastMsg}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Call Reviews</h1>
          <p className="text-sm text-gray-400">{calls.length} total calls analyzed</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <input
              type="text"
              placeholder="Search by rep name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 rounded-lg border border-white/10 bg-white/5 px-4 py-2 pl-10 text-sm text-white placeholder-gray-500 backdrop-blur-xl"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-xl active:scale-[0.97]"
          >
            <span>⬆️</span>
            <span className="hidden sm:inline">Upload Call</span>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          className="rounded-xl border border-white/5 flex flex-col items-center justify-center py-16 text-center"
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <span className="text-4xl mb-4 opacity-50">🔍</span>
          <h3 className="text-lg font-semibold text-white mb-1">No results found</h3>
          <p className="text-sm text-gray-400 max-w-sm">No calls match "{search}". Try a different search term.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5" style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(139,92,246,0.04) 50%, rgba(255,255,255,0.02) 100%)",
          backdropFilter: "blur(24px)",
        }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5 text-gray-400">
                  <th className="px-6 py-3 font-medium">Rep</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Duration</th>
                  <th className="px-6 py-3 font-medium">Score</th>
                  <th className="px-6 py-3 font-medium">Sentiment</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((call) => (
                  <tr key={call.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-6 py-4 font-medium text-white">
                      {call.rep_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {formatDate(call.started_at)}
                    </td>
                    <td className="px-6 py-4 text-gray-400">
                      {formatDuration(call.duration_seconds)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${
                        call.overall_score >= 85 ? "text-green-400" :
                        call.overall_score >= 70 ? "text-yellow-400" :
                        call.overall_score ? "text-red-400" : "text-gray-400"
                      }`}>
                        {call.overall_score ?? "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        call.sentiment === "positive" ? "bg-green-900/50 text-green-300" :
                        call.sentiment === "negative" ? "bg-red-900/50 text-red-300" :
                        "bg-white/5 text-gray-300"
                      }`}>
                        {call.sentiment || "neutral"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        call.status === "analyzed" ? "bg-green-900/50 text-green-300" :
                        call.status === "processing" ? "bg-blue-900/50 text-blue-300 animate-pulse" :
                        "bg-red-900/50 text-red-300"
                      }`}>
                        {call.status === "processing" ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-300 animate-pulse" />
                            Processing
                          </span>
                        ) : call.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        to="/dashboard/calls/$callId"
                        params={{ callId: call.id }}
                        className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal()}
    </div>
  );

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
        <div
          className="relative w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl"
          style={{
            background: "linear-gradient(135deg, rgba(15, 19, 34, 0.98) 0%, rgba(20, 15, 40, 0.98) 50%, rgba(10, 13, 26, 0.98) 100%)",
            backdropFilter: "blur(32px)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <h2 className="text-lg font-semibold text-white">Upload Call Recording</h2>
            <button
              onClick={() => {
                if (!uploading) {
                  setShowUpload(false);
                  setUploadFile(null);
                  setUploadError(null);
                  setUploadProgress(0);
                }
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

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
                  ? "border-purple-500 bg-purple-500/5"
                  : uploadFile
                    ? "border-green-500/30 bg-green-500/5"
                    : "border-white/10 hover:border-purple-500/30 hover:bg-white/[0.02]"
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
                  <p className="text-sm text-white font-medium truncate">{uploadFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUploadFile(null);
                    }}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-3xl">📁</span>
                  <p className="text-sm text-gray-300">
                    <span className="text-purple-400 font-medium">Click to browse</span> or drag & drop
                  </p>
                  <p className="text-xs text-gray-500">
                    MP3, WAV, OGG, WEBM, M4A, FLAC — max 50MB
                  </p>
                </div>
              )}
            </div>

            {/* Direction Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Direction</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setUploadDirection("outbound")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    uploadDirection === "outbound"
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                      : "bg-white/5 text-gray-400 border border-white/5 hover:text-white"
                  }`}
                >
                  📤 Outbound
                </button>
                <button
                  type="button"
                  onClick={() => setUploadDirection("inbound")}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    uploadDirection === "inbound"
                      ? "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                      : "bg-white/5 text-gray-400 border border-white/5 hover:text-white"
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
                  <span className="text-gray-400">
                    {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                  </span>
                  <span className="text-gray-400">{uploadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${uploadProgress}%`,
                      background: "linear-gradient(90deg, #7c3aed, #6366f1)",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Error message */}
            {uploadError && (
              <div className="rounded-lg bg-red-900/30 border border-red-500/20 px-4 py-3 text-sm text-red-300">
                {uploadError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <button
              onClick={() => {
                setShowUpload(false);
                setUploadFile(null);
                setUploadError(null);
                setUploadProgress(0);
              }}
              disabled={uploading}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-300 transition-all hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!uploadFile || uploading}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              {uploading ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <span>⬆️</span>
                  Upload Recording
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
}
