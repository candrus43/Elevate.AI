import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/library")({
  component: TrainingLibrary,
});

function TrainingLibrary() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const filters = ["All", "Videos", "Documents", "Playbooks", "Scripts", "Objections", "Product Knowledge"];

  const content = [
    { id: "c1", title: "ElevateAI Product Demo v3", type: "Video", category: "Product Knowledge", tags: ["demo", "features"], duration: "12 min", description: "Complete walkthrough of ElevateAI platform features" },
    { id: "c2", title: "Cold Calling Script", type: "Script", category: "Scripts", tags: ["cold-call", "outbound"], duration: "5 min", description: "Proven cold calling script for SaaS prospects" },
    { id: "c3", title: "Objection: Price Too High", type: "Objection", category: "Objections", tags: ["pricing", "negotiation"], duration: "8 min", description: "How to handle 'it's too expensive' objections" },
    { id: "c4", title: "Enterprise Sales Playbook", type: "Playbook", category: "Playbooks", tags: ["enterprise", "sales"], duration: "45 min", description: "Complete enterprise sales methodology playbook" },
    { id: "c5", title: "Discovery Call Best Practices", type: "Document", category: "Documents", tags: ["discovery", "qualifying"], duration: "15 min", description: "Framework for effective discovery calls" },
    { id: "c6", title: "Product Knowledge FAQ", type: "Document", category: "Product Knowledge", tags: ["faq", "product"], duration: "20 min", description: "Frequently asked questions about ElevateAI" },
  ];

  const filtered = content.filter(c => (filter === "All" || c.type === filter) && c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">Training Library</h1>
          <p className="text-sm text-gray-400">Browse all training materials</p>
        </div>
        <button onClick={() => setShowUpload(true)} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">+ Upload</button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search training library..." className="w-full rounded-xl border border-gray-200 bg-white px-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-purple-500/50" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${filter === f ? "text-white bg-gradient-to-r from-purple-600 to-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"}`}>{f}</button>
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => (
          <div key={item.id} className="group rounded-xl border border-gray-200 bg-white p-5 transition-all hover:shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-start justify-between mb-2">
              <span className={`rounded-lg px-2 py-1 text-[10px] font-bold ${
                item.type === "Video" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                item.type === "Document" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" :
                item.type === "Playbook" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300" :
                item.type === "Script" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" :
                "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300"
              }`}>{item.type}</span>
              <span className="text-xs text-gray-400">{item.duration}</span>
            </div>
            <h4 className="font-medium text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">{item.title}</h4>
            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.tags.map((t, i) => (
                <span key={i} className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-gray-800 dark:text-gray-400">{t}</span>
              ))}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full py-8 text-center text-sm text-gray-500">No content found matching your search.</div>}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowUpload(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Upload Training Content</h3>
              <button onClick={() => setShowUpload(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Title</label>
                <input type="text" placeholder="Content title" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Type</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option>Video</option><option>Document</option><option>Playbook</option><option>Script</option><option>Objection</option><option>Product Knowledge</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Category</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option>Product Knowledge</option><option>Scripts</option><option>Objections</option><option>Playbooks</option><option>Documents</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-300">Content URL or Text</label>
                <textarea rows={3} placeholder="Paste content URL or text..." className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
              </div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Upload & Process</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}