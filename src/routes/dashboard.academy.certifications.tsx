import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/certifications")({
  component: CertificationHub,
});

function CertificationHub() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const certs = [
    { id: "cert-1", title: "Enterprise Sales Certified", prerequisites: ["Enterprise Sales Mastery course", "Final exam 85%+"], progress: 72, earned: false, color: "from-accent-500 to-accent-600" },
    { id: "cert-2", title: "ElevateAI Product Expert", prerequisites: ["Product Knowledge course", "Quiz score 90%+"], progress: 100, earned: true, color: "from-emerald-500 to-green-600" },
    { id: "cert-3", title: "Objection Handling Pro", prerequisites: ["Objection Masterclass", "Roleplay score 80%+"], progress: 45, earned: false, color: "from-amber-500 to-orange-600" },
    { id: "cert-4", title: "Sales Communication Mastery", prerequisites: ["Active Listening course", "Discovery call assessment"], progress: 0, earned: false, color: "from-cyan-500 to-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-ink">Certification Hub</h1><p className="text-sm text-ink-muted">Earn certifications to validate your skills</p></div>
        <button onClick={() => setShowCreate(true)} className="rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">+ Create</button>
      </div>

      {/* Earned Badges */}
      <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-emerald-500/5 to-green-500/5 p-5 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-ink mb-3">🏆 Earned Certifications</h3>
        <div className="flex flex-wrap gap-3">
          {certs.filter(c => c.earned).map((cert) => (
            <div key={cert.id} className="rounded-xl border border-emerald-200 bg-white p-4 text-center dark:border-emerald-800 dark:bg-gray-900">
              <span className="text-3xl block mb-1">🎓</span>
              <p className="text-xs font-medium text-ink">{cert.title}</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Earned ✓</p>
            </div>
          ))}
          {certs.filter(c => c.earned).length === 0 && <p className="text-sm text-ink-faint">No certifications earned yet.</p>}
        </div>
      </div>

      {/* Available Certifications */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {certs.map((cert) => (
          <div key={cert.id} className={`rounded-xl border bg-white p-5 dark:bg-gray-900 ${cert.earned ? "border-emerald-300 dark:border-emerald-700" : "border-edge"}`}>
            <div className={`h-1.5 rounded-t-xl bg-gradient-to-r ${cert.color} -mx-5 -mt-5 mb-4`} />
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-semibold text-ink">{cert.title}</h4>
              {cert.earned && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">✓ Earned</span>}
            </div>
            <div className="mb-3">
              <p className="text-xs font-medium text-ink-faint mb-1">Prerequisites:</p>
              <ul className="space-y-0.5">
                {cert.prerequisites.map((p, i) => <li key={i} className="text-xs text-ink-faint flex items-center gap-1">• {p}</li>)}
              </ul>
            </div>
            {!cert.earned && (
              <>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink-faint">Progress</span>
                  <span className="font-medium text-ink-muted">{cert.progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.06] mb-4">
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${cert.color}`} style={{ width: `${cert.progress}%` }} />
                </div>
                <button className="w-full rounded-lg text-white bg-gradient-to-r from-accent-600 to-accent-600 py-2 text-xs font-medium text-white hover:from-accent-500 hover:to-accent-500">{cert.progress > 0 ? "Continue" : "Start"}</button>
              </>
            )}
          </div>
        ))}
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-ink">Create Certification</h3><button onClick={() => setShowCreate(false)} className="text-2xl text-ink-muted hover:text-gray-600">&times;</button></div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Title</label><input type="text" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-ink" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Linked Course</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-ink"><option>Enterprise Sales Mastery</option><option>Product Knowledge</option></select></div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">Create Certification</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}