import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/academy/assignments")({
  component: ManagerAssignments,
});

function ManagerAssignments() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRep, setSelectedRep] = useState("all");
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const reps = [
    { id: "all", name: "All Reps" },
    { id: "r1", name: "Alex Johnson" },
    { id: "r2", name: "Maria Garcia" },
    { id: "r3", name: "James Wilson" },
    { id: "r4", name: "Sarah Thompson" },
    { id: "r5", name: "David Kim" },
  ];

  const assignments = [
    { rep: "Alex Johnson", item: "Enterprise Sales Mastery", type: "Course", due: "2026-07-25", status: "In Progress" as const },
    { rep: "Maria Garcia", item: "Objection Handling Scenarios Quiz", type: "Quiz", due: "2026-07-20", status: "Pending" as const },
    { rep: "James Wilson", item: "Objection Handling Masterclass", type: "Course", due: "2026-07-18", status: "Completed" as const },
    { rep: "Sarah Thompson", item: "Cold Calling Script Review", type: "Content", due: "2026-07-15", status: "Overdue" as const },
    { rep: "David Kim", item: "Enterprise Sales Certification", type: "Certification", due: "2026-08-01", status: "In Progress" as const },
    { rep: "Alex Johnson", item: "Product Knowledge Quiz", type: "Quiz", due: "2026-07-22", status: "In Progress" as const },
    { rep: "Maria Garcia", item: "Active Listening Course", type: "Course", due: "2026-07-28", status: "Pending" as const },
  ];

  const filtered = selectedRep === "all" ? assignments : assignments.filter(a => a.rep === reps.find(r => r.id === selectedRep)?.name);

  const statusColors = {
    "Pending": "transition-colors hover:bg-white/5 text-gray-300",
    "In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
    "Completed": "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
    "Overdue": "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/academy" className="text-2xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-white">Manager Assignments</h1><p className="text-sm text-gray-400">Assign training content to your team</p></div>
        <button onClick={() => setShowAssign(true)} className="rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">+ Assign</button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-500">Filter by rep:</label>
        <select value={selectedRep} onChange={(e) => setSelectedRep(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-purple-500/50">
          {reps.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>

      {/* Assignments Table */}
      <div className="rounded-2xl glass-subtle transition-all duration-300">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Rep</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Due</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((a, i) => (
                <tr key={i} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-3.5 text-sm font-medium text-white">{a.rep}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-300">{a.item}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.type === "Course" ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300" :
                      a.type === "Quiz" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                      "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300"
                    }`}>{a.type}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-gray-300">{a.due}</td>
                  <td className="px-4 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusColors[a.status]}`}>{a.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowAssign(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-white">Assign Content</h3><button onClick={() => setShowAssign(false)} className="text-2xl text-gray-400 hover:text-gray-600">&times;</button></div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Rep</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  {reps.slice(1).map(r => <option key={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Content Type</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option>Course</option><option>Quiz</option><option>Content</option><option>Certification</option>
                </select>
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Item</label>
                <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                  <option>Enterprise Sales Mastery</option><option>Objection Handling Masterclass</option><option>Product Knowledge Quiz</option>
                </select>
              </div>
              <div><label className="mb-1.5 block text-sm font-medium text-gray-300">Due Date</label><input type="date" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" /></div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-sm font-medium text-white hover:from-purple-500 hover:to-indigo-500">Assign</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}