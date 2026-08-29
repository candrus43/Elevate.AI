import { useEffect, useState } from "react";
import { GlassCard, GlassCardHeader, GlassCardBody, GlassCardRow, GlassBadge, GlassButton, GlassInput, GlassSelect, GlassStatCard, LoadingSkeleton, EmptyState } from "~/components/GlassCard";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard/coaching-automation/tasks")({
  component: TaskManagement,
});

function TaskManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [tasks, setTasks] = useState({
    todo: [
      { id: "t1", title: "Create coaching plan for new hire", priority: "High" as const, assignee: "Self" },
      { id: "t2", title: "Review call recordings for Alex", priority: "Medium" as const, assignee: "Self" },
      { id: "t3", title: "Update scorecard templates", priority: "Low" as const, assignee: "Sarah" },
    ],
    inProgress: [
      { id: "t4", title: "Review quarterly performance reports", priority: "High" as const, assignee: "Self" },
      { id: "t5", title: "Prepare 1:1 meeting with James", priority: "Medium" as const, assignee: "Self" },
    ],
    done: [
      { id: "t6", title: "Schedule team training session", priority: "Low" as const, assignee: "Alex" },
      { id: "t7", title: "Complete compliance audit", priority: "High" as const, assignee: "Self" },
      { id: "t8", title: "Update coaching playbook", priority: "Medium" as const, assignee: "Sarah" },
    ],
  });

  useEffect(() => {
    fetch("/api/session").then(r => r.json()).then(({ user }) => {
      if (!user) { navigate({ to: "/login" }); return; }
      setUser(user);
      setLoading(false);
    });
  }, [navigate]);

  if (loading) return <div className="flex items-center justify-center h-48"><LoadingSkeleton className="h-8 w-8 rounded-full" /></div>;

  const moveTask = (taskId: string, from: keyof typeof tasks, to: keyof typeof tasks) => {
    const task = tasks[from].find(t => t.id === taskId);
    if (!task) return;
    setTasks(prev => ({
      ...prev,
      [from]: prev[from].filter(t => t.id !== taskId),
      [to]: [...prev[to], task],
    }));
  };

  const columns = [
    { id: "todo" as const, label: "To Do", items: tasks.todo, color: "border-gray-300 dark:border-gray-600" },
    { id: "inProgress" as const, label: "In Progress", items: tasks.inProgress, color: "border-blue-400 dark:border-blue-600" },
    { id: "done" as const, label: "Done", items: tasks.done, color: "border-green-400 dark:border-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/dashboard/coaching-automation" className="text-2xl text-ink-muted hover:text-gray-600 dark:hover:text-ink-muted">&larr;</Link>
        <div className="flex-1"><h1 className="text-2xl font-bold text-ink">Task Management</h1><p className="text-sm text-ink-muted">Manage coaching tasks with Kanban board</p></div>
        <button onClick={() => setShowCreate(true)} className="rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 px-4 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">+ New Task</button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {columns.map((col) => (
          <div key={col.id} className={`rounded-xl border-t-4 ${col.color} rounded-2xl glass-subtle transition-all duration-300`}>
            <div className="border-b border-gray-200 px-5 py-3 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">{col.label}</h3>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-ink-muted">{col.items.length}</span>
            </div>
            <div className="p-3 space-y-2 min-h-[200px]">
              {col.items.map((task) => (
                <div key={task.id} className="rounded-lg border border-gray-200 bg-white p-3 transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-ink">{task.title}</p>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                      task.priority === "High" ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300" :
                      task.priority === "Medium" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300" :
                      "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                    }`}>{task.priority}</span>
                  </div>
                  <p className="text-[10px] text-ink-muted mb-2">👤 {task.assignee}</p>
                  <div className="flex gap-1">
                    {col.id !== "todo" && (
                      <button onClick={() => moveTask(task.id, col.id, "todo")} className="rounded bg-gray-100 px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-ink-muted">← Todo</button>
                    )}
                    {col.id === "todo" && (
                      <button onClick={() => moveTask(task.id, "todo", "inProgress")} className="rounded bg-blue-100 px-2 py-1 text-[10px] text-blue-600 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-300">→ Start</button>
                    )}
                    {col.id === "inProgress" && (
                      <>
                        <button onClick={() => moveTask(task.id, "inProgress", "done")} className="rounded bg-green-100 px-2 py-1 text-[10px] text-green-600 hover:bg-green-200 dark:bg-green-900/50 dark:text-green-300">✓ Done</button>
                      </>
                    )}
                    {col.id === "done" && (
                      <button onClick={() => moveTask(task.id, "done", "inProgress")} className="rounded bg-amber-100 px-2 py-1 text-[10px] text-amber-600 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300">↩ Reopen</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700 dark:bg-gray-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-ink">Create Task</h3><button onClick={() => setShowCreate(false)} className="text-2xl text-ink-muted hover:text-gray-600">&times;</button></div>
            <div className="space-y-4">
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Title</label><input type="text" placeholder="Task title" className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-ink" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Priority</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-ink"><option>High</option><option>Medium</option><option>Low</option></select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Assignee</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-ink"><option>Self</option><option>Sarah</option><option>Alex</option><option>James</option></select></div>
              <div><label className="mb-1.5 block text-sm font-medium text-ink-muted">Status</label><select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-ink"><option>To Do</option><option>In Progress</option><option>Done</option></select></div>
              <button className="w-full rounded-xl text-white bg-gradient-to-r from-accent-600 to-accent-600 py-2.5 text-sm font-medium text-white hover:from-accent-500 hover:to-accent-500">Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}