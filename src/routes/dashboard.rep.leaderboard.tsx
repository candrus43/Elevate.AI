import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { UserSession } from "~/utils/auth";
import { getLeaderboardRank, getUserPoints } from "~/utils/db";

export const Route = createFileRoute("/dashboard/rep/leaderboard")({
  component: RepLeaderboardPage,
});

function RepLeaderboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserSession | null>(null);
  const [rank, setRank] = useState<any>(null);
  const [points, setPoints] = useState(0);
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
        try {
          const [rankData, pointsData] = await Promise.all([
            getLeaderboardRank(user.id, user.companyId),
            getUserPoints(user.id),
          ]);
          setRank(rankData);
          setPoints(pointsData);
        } catch (e) {
          console.error("Failed to fetch leaderboard", e);
        }
        setLoading(false);
      })
      .catch(() => {
        navigate({ to: "/login" });
      });
  }, [navigate]);

  if (loading) return <RepLeaderboardSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-sm text-gray-400">See where you rank among your team</p>
      </div>

      {/* Current Rank Card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-600/30 border-2 border-purple-500/40">
              <span className="text-3xl font-bold text-purple-300">
                {rank ? `#${rank.rank}` : "—"}
              </span>
            </div>
            {rank && rank.rank <= 3 && (
              <span className="absolute -top-1 -right-1 text-xl">
                {rank.rank === 1 ? "👑" : rank.rank === 2 ? "🥈" : "🥉"}
              </span>
            )}
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg font-semibold text-white">Your Ranking</h2>
            <p className="text-sm text-gray-400 mt-1">
              {rank
                ? `${rank.leaderboard_name} · ${rank.period || "current"} period`
                : "Not ranked yet"}
            </p>
            <div className="flex items-center gap-4 mt-3 justify-center sm:justify-start">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{points}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Points</p>
              </div>
              {rank && (
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{rank.score}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Score</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Placeholder for full leaderboard */}
      <div className="glass-card rounded-xl p-12 text-center">
        <span className="text-4xl">🏆</span>
        <h3 className="mt-4 text-lg font-medium text-white">
          {rank ? "Full leaderboard coming soon" : "Complete calls to earn your rank"}
        </h3>
        <p className="mt-1 text-sm text-gray-400">
          {rank
            ? "The full team leaderboard with all members will be available soon."
            : "Your score and ranking will appear here once you complete calls and earn points."}
        </p>
        {rank && (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-4 py-1.5">
            <span className="text-sm text-purple-300">Your rank: #{rank.rank}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function RepLeaderboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="h-7 w-28 rounded-lg bg-white/5 animate-pulse" />
        <div className="h-4 w-36 rounded-lg bg-white/5 animate-pulse" />
      </div>
      <div className="glass-card rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="h-20 w-20 rounded-full bg-white/5 animate-pulse" />
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-5 w-28 rounded bg-white/5 animate-pulse" />
            <div className="h-4 w-36 rounded bg-white/5 animate-pulse" />
            <div className="flex gap-4 justify-center sm:justify-start">
              <div className="h-10 w-16 rounded bg-white/5 animate-pulse" />
              <div className="h-10 w-16 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}