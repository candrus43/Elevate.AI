import { useEffect, useState, useRef } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { getUserCalls, db } from "~/utils/db";

export const Route = createFileRoute("/dashboard/rep/calls")({
  component: RepCallsPage,
});

interface Call {
  id: string;
  direction: string;
  duration_seconds: number;
  started_at: string;
  status: string;
  overall_score: number;
  sentiment: string;
  rep_name: string;
  recording_url?: string;
}

function RepCallsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadCalls = async (userId: string) => {
    try {
      const data = await getUserCalls(userId, 50);
      setCalls(data);
    } catch (e) {
      console.error("Failed to fetch calls", e);
    }
  };

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(async ({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        setUser(user);
        await loadCalls(user.id);
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const handleUpload = async (file: File) => {
    if (!user || !file) return;
    const validTypes = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4", "audio/x-m4a", "audio/flac", ""];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const validExts = ["mp3", "wav", "ogg", "webm", "mp4", "m4a", "flac"];
    if (!validExts.includes(ext) && !validTypes.includes(file.type)) {
      setUploadProgress("Unsupported file type. Please use MP3, WAV, OGG, or WEBM.");
      setTimeout(() => setUploadProgress(""), 3000);
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setUploadProgress("File too large. Maximum size is 50MB.");
      setTimeout(() => setUploadProgress(""), 3000);
      return;
    }
    setUploading(true);
    setUploadProgress("Uploading: 0%");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("direction", "outbound");
      formData.append("started_at", new Date().toISOString());
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const pct = parseInt(prev.match(/\d+/)?.[0] || "0");
          return pct < 90 ? "Uploading: " + Math.min(pct + 15, 90) + "%" : prev;
        });
      }, 400);
      const res = await fetch("/api/calls/upload", { method: "POST", body: formData });
      clearInterval(progressInterval);
      const data = await res.json();
      if (data.success) {
        setUploadProgress("Upload complete! Analyzing call...");
        setShowUpload(false);
        // Poll for analysis completion
        let attempts = 0;
        const pollInterval = setInterval(async () => {
          attempts++;
          await loadCalls(user.id);
          const updatedCall = (await getUserCalls(user.id, 50)).find((c: any) => c.id === data.call.id);
          if (updatedCall?.status === "analyzed" || attempts > 15) {
            clearInterval(pollInterval);
            setUploadProgress("");
            setUploading(false);
          }
        }, 2000);
      } else {
        setUploadProgress("Upload failed: " + (data.error || "Unknown error"));
        setTimeout(() => { setUploadProgress(""); setUploading(false); }, 3000);
      }
    } catch (e) {
      setUploadProgress("Upload failed. Please try again.");
      setTimeout(() => { setUploadProgress(""); setUploading(false); }, 3000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  if (loading) return <RepCallsSkeleton />;

  const filtered = calls
    .filter((c) => {
      if (!search) return true;
      const dateStr = c.started_at ? new Date(c.started_at).toLocaleDateString() : "";
      return dateStr.includes(search) || (c.rep_name || "").toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.started_at || 0).getTime() - new Date(a.started_at || 0).getTime();
      }
      return (b.overall_score || 0) - (a.overall_score || 0);
    });

  const avgScore = calls.length > 0
    ? (calls.reduce((s, c) => s + (c.overall_score || 0), 0) / calls.length).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">My Calls</h1>
          <p className="text-sm text-gray-400">{calls.length} total calls · Avg {avgScore}</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary flex items-center gap-2"
          disabled={uploading}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          {uploading ? "Uploading..." : "Upload Recording"}
        </button>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <div
          className={`glass-card rounded-xl p-8 text-center border-2 border-dashed transition-all ${
            dragOver ? "border-purple-500 bg-purple-500/5" : "border-white/10 hover:border-purple-500/30"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
              </div>
              <p className="text-sm text-purple-300">{uploadProgress}</p>
              <div className="h-1.5 w-full max-w-xs mx-auto rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                  style={{ width: uploadProgress.match(/\d+/)?.[0] + "%" || "0%" }}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <span className="text-4xl">🎧</span>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Upload a Call Recording</h3>
              <p className="text-sm text-gray-400 mb-4">
                Drag & drop an audio file here, or click to browse
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Supports MP3, WAV, OGG, WEBM, M4A, FLAC · Max 50MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.wav,.ogg,.webm,.m4a,.flac,audio/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary"
              >
                Browse Files
              </button>
            </>
          )}
        </div>
      )}

      {/* Upload Progress Toast */}
      {uploadProgress && !showUpload && (
        <div className="glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-up">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-purple-300">{uploadProgress}</p>
        </div>
      )}

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search by date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 pl-10 text-sm text-white placeholder-gray-500 backdrop-blur-sm focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
          />
        </div>
        <div className="flex rounded-xl border border-white/10 bg-white/5 p-1">
          <button
            onClick={() => setSortBy("date")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${sortBy === "date" ? "bg-purple-500/20 text-purple-300" : "text-gray-400 hover:text-white"}`}
          >
            Latest
          </button>
          <button
            onClick={() => setSortBy("score")}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${sortBy === "score" ? "bg-purple-500/20 text-purple-300" : "text-gray-400 hover:text-white"}`}
          >
            Best Score
          </button>
        </div>
      </div>

      {/* Calls */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="text-4xl">🎧</span>
          <h3 className="mt-4 text-lg font-medium text-white">No calls found</h3>
          <p className="mt-1 text-sm text-gray-400">
            {search ? "Try a different search term." : "Upload a call recording to get started."}
          </p>
          {!search && (
            <button onClick={() => setShowUpload(true)} className="btn-primary mt-4">
              Upload Your First Call
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((call, i) => (
            <Link
              key={call.id}
              to="/dashboard/calls/$callId"
              params={{ callId: call.id }}
              className="block glass-card rounded-xl p-4 sm:p-5 animate-fade-up"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {call.status === "processing" && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-400">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                        Analyzing
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {call.started_at ? new Date(call.started_at).toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                      }) : "Unknown date"}
                    </span>
                    <span className="text-xs text-gray-600">·</span>
                    <span className="text-xs text-gray-500">
                      {call.duration_seconds ? `${Math.floor(call.duration_seconds / 60)}:${String(call.duration_seconds % 60).padStart(2, "0")}` : "—"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${call.direction === "inbound" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                      {call.direction || "outbound"}
                    </span>
                    {call.recording_url && (
                      <span className="text-[10px] text-gray-600">📹</span>
                    )}
                  </div>
                  {call.status && (
                    <p className="mt-1 text-sm text-gray-400 capitalize">{call.status}</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {call.overall_score ? (
                    <span className={`text-lg font-bold font-mono ${call.overall_score >= 85 ? "text-emerald-400" : call.overall_score >= 70 ? "text-amber-300" : "text-red-400"}`}>
                      {call.overall_score}
                    </span>
                  ) : call.status === "processing" ? (
                    <span className="text-lg font-mono text-gray-500">...</span>
                  ) : null}
                  <span className="text-gray-600 text-sm">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function RepCallsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-24 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-36 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="flex gap-3">
        <div className="h-10 flex-1 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-10 w-36 rounded-xl bg-white/5 animate-pulse" />
      </div>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 w-44 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
            </div>
            <div className="h-6 w-10 rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}