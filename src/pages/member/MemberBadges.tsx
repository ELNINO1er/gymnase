import { useEffect, useState } from "react";
import { Award, Lock } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { badgesApi } from "../../services/api";

export function MemberBadges() {
  const { user } = useAuth();
  const [badges, setBadges] = useState<any[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // D'abord verifier si de nouveaux badges sont gagnes
    badgesApi.checkAndAward(user.id).catch(() => {});

    // Puis charger tous les badges
    badgesApi.getUserBadges(user.id).then(({ data }) => {
      setBadges(data.data.badges);
      setEarnedCount(data.data.earned_count);
      setTotalCount(data.data.total_count);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  const ICON_MAP: Record<string, string> = {
    footprints: "👣", flame: "🔥", zap: "⚡", crown: "👑", star: "⭐",
    "calendar-check": "📅", shield: "🛡️", award: "🏆", target: "🎯", medal: "🏅",
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Mes badges</h1>
      <p className="text-zinc-400 text-sm mb-6">{earnedCount} / {totalCount} badge(s) obtenu(s)</p>

      {/* Barre de progression */}
      <div className="bg-zinc-800 rounded-full h-3 mb-8 overflow-hidden">
        <div className="bg-amber-400 h-full rounded-full transition-all" style={{ width: `${totalCount > 0 ? (earnedCount / totalCount) * 100 : 0}%` }} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div key={badge.id} className={`rounded-2xl p-5 text-center transition ${badge.earned ? "bg-zinc-900 border border-amber-400/30" : "bg-zinc-900/50 border border-zinc-800 opacity-50"}`}>
            <div className="text-4xl mb-3">{ICON_MAP[badge.icon] || "🏆"}</div>
            <div className="font-bold text-sm">{badge.name}</div>
            <div className="text-xs text-zinc-500 mt-1">{badge.description}</div>
            {badge.earned ? (
              <div className="mt-3 inline-flex items-center gap-1 text-xs bg-amber-400/10 text-amber-400 px-2 py-1 rounded-full">
                <Award size={12} />
                {new Date(badge.earned_at).toLocaleDateString("fr-FR")}
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-1 text-xs text-zinc-600">
                <Lock size={12} />
                Non obtenu
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
