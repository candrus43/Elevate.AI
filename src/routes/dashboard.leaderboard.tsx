import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { db } from "~/utils/db";
import { sql } from "~/utils/sql";

export const Route = createFileRoute("/dashboard/leaderboard")({
  component: LeaderboardPage,
});

interface LeaderboardEntry {
  rank: number;
  user_name: string;
  user_id: string;
  avatar_url: string;
  score: number;
  calls_count: number;
  is_current_user: boolean;
}

function LeaderboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then(async ({ user }) => {
        if (!user) {
          navigate({ to: "/login" });
          return;
        }
        setUser(user);
        await fetchLeaderboard(user.companyId, user.id);
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  const fetchLeaderboard = async (companyId: string, userId: string) => {
    try {
      const data = await db(sql`
        SELECT
          le.rank,
          u.name as user_name,
          u.id as user_id,
          u.avatar_url,
          le.score,
          le.calls_count,
          CASE WHEN u.id = ${userId} THEN 1 ELSE 0 END as is_current_user
        FROM leaderboard_entries le
        JOIN users u ON u.id = le.user_id
        JOIN leaderboards lb ON lb.id = le.leaderboard_id
        WHERE lb.company_id = ${companyId}
          AND lb.period = ${period}
          AND lb.is_active = 1
        ORDER BY le.rank ASC
        LIMIT 20
      `);
      setEntries(data);
    } catch (e) {
      console.error("Failed to fetch leaderboard", e);
      setEntries([]);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      fetchLeaderboard(user.companyId, user.id).then(() => setLoading(false));
    }
  }, [period, user?.companyId]);

  const getMedal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-sm text-gray-400">See how your team ranks</p>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setPeriod("weekly")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            period === "weekly"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10"
              : "text-gray-400 border border-white/5 hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="mr-1.5">📅</span>
          Weekly
        </button>
        <button
          onClick={() => setPeriod("monthly")}
          className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            period === "monthly"
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-500/10"
              : "text-gray-400 border border-white/5 hover:text-white hover:bg-white/5"
          }`}
        >
          <span className="mr-1.5">📆</span>
          Monthly
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <LeaderboardSkeleton />
      ) : entries.length === 0 ? (
        /* Empty State */
        <div className="glass-card rounded-xl p-12 text-center">
          <span className="text-4xl">🏆</span>
          <h3 className="mt-4 text-lg font-medium text-white">No standings yet</h3>
          <p className="mt-1 text-sm text-gray-400">
            Leaderboard data will appear once team members start completing calls.
          </p>
        </div>
      ) : (
        /* Podium for top 3 */
        <>
          {/* Podium */}
          <div className="flex items-end justify-center gap-3 sm:gap-6 px-4">
            {/* 2nd Place */}
            {entries[1] && (
              <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "100ms" }}>
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-400 text-lg sm:text-xl font-bold text-white shadow-lg">
                  {entries[1]?.user_name?.charAt(0) || "?"}
                </div>
                <p className="mt-2 text-xs font-medium text-gray-300 text-center max-w-[80px] truncate">
                  {entries[1]?.user_name}
                </p>
                <div className="mt-2 flex h-20 sm:h-24 w-20 sm:w-24 items-center justify-center rounded-t-xl bg-gradient-to-t from-gray-500/30 to-gray-500/10 border border-gray-500/20">
                  <div className="text-center">
                    <span className="text-2xl">🥈</span>
                    <p className="text-xs font-bold text-white">{entries[1]?.score}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {entries[0] && (
              <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "50ms" }}>
                <div className="relative">
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-lg sm:text-xl">👑</span>
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 text-xl sm:text-2xl font-bold text-white shadow-glow-lg">
                    {entries[0]?.user_name?.charAt(0) || "?"}
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-white text-center max-w-[80px] truncate">
                  {entries[0]?.user_name}
                </p>
                <div className="mt-2 flex h-24 sm:h-28 w-24 sm:w-28 items-center justify-center rounded-t-xl bg-gradient-to-t from-amber-500/30 to-amber-500/10 border border-amber-500/20 glow-sm">
                  <div className="text-center">
                    <span className="text-3xl">🥇</span>
                    <p className="text-lg font-bold text-white">{entries[0]?.score}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {entries[2] && (
              <div className="flex flex-col items-center animate-fade-up" style={{ animationDelay: "150ms" }}>
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 to-amber-800 text-lg font-bold text-white shadow-lg">
                  {entries[2]?.user_name?.charAt(0) || "?"}
                </div>
                <p className="mt-2 text-xs font-medium text-gray-300 text-center max-w-[80px] truncate">
                  {entries[2]?.user_name}
                </p>
                <div className="mt-2 flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-t-xl bg-gradient-to-t from-amber-800/30 to-amber-800/10 border border-amber-800/20">
                  <div className="text-center">
                    <span className="text-2xl">🥉</span>
                    <p className="text-xs font-bold text-white">{entries[2]?.score}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Full Leaderboard Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Score</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Calls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {entries.map((entry, i) => {
                    const medal = getMedal(entry.rank);
                    const isYou = entry.is_current_user;
                    return (
                      <tr
                        key={entry.user_id}
                        className={`transition-colors ${
                          isYou
                            ? "bg-purple-500/10 border-l-2 border-l-purple-500"
                            : "hover:bg-white/5"
                        }`}
                      >
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            {medal ? (
                              <span className="text-lg">{medal}</span>
                            ) : (
                              <span className="w-6 text-center text-sm font-mono text-gray-500">
                                #{entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30 text-sm font-medium text-purple-300">
                              {entry.user_name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-medium ${isYou ? "text-purple-300" : "text-white"}`}>
                                {entry.user_name}
                              </span>
                              {isYou && (
                                <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                                  You
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right">
                          <span className={`font-bold font-mono ${
                            entry.score >= 90 ? "text-emerald-400" :
                            entry.score >= 70 ? "text-amber-300" :
                            "text-gray-400"
                          }`}>
                            {entry.score}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-right text-gray-400 font-mono text-xs">
                          {entry.calls_count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Podium skeleton */}
      <div className="flex items-end justify-center gap-6 px-4">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-white/5 animate-pulse" />
          <div className="mt-2 h-3 w-16 rounded bg-white/5 animate-pulse" />
          <div className="mt-2 h-20 w-20 rounded-t-xl bg-white/5 animate-pulse" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-full bg-white/5 animate-pulse" />
          <div className="mt-2 h-3 w-16 rounded bg-white/5 animate-pulse" />
          <div className="mt-2 h-24 w-24 rounded-t-xl bg-white/5 animate-pulse" />
        </div>
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-white/5 animate-pulse" />
          <div className="mt-2 h-3 w-16 rounded bg-white/5 animate-pulse" />
          <div className="mt-2 h-16 w-16 rounded-t-xl bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-5 w-8 rounded bg-white/5 animate-pulse" />
            <div className="h-8 w-8 rounded-full bg-white/5 animate-pulse" />
            <div className="flex-1 h-4 w-32 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-10 rounded bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}