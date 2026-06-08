import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { crmApi } from "../../services/api";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Select } from "../../components/ui";

const LEVEL_OPTIONS = [{ value: "", label: "Tous niveaux" }, { value: "HIGH", label: "Risque eleve" }, { value: "MEDIUM", label: "Risque moyen" }, { value: "LOW", label: "Risque faible" }];

export function AdminRiskScores() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => { load(); }, [level]);

  const load = () => {
    crmApi.getRiskScores(level || undefined).then(({ data: res }) => { setData(res.data); setLoading(false); }).catch(() => setLoading(false));
  };

  const recalculate = async () => {
    setRecalculating(true);
    await crmApi.recalculateRiskScores();
    load();
    setRecalculating(false);
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  const riskColor = (l: string) => l === "HIGH" ? "text-red-400 bg-red-500/10" : l === "MEDIUM" ? "text-amber-400 bg-amber-400/10" : "text-green-400 bg-green-500/10";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Score de risque d'abandon</h1>
        <button onClick={recalculate} disabled={recalculating} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm">
          <RefreshCw size={14} className={recalculating ? "animate-spin" : ""} /> Recalculer
        </button>
      </div>

      {/* Resume */}
      {data?.summary && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-red-400">{data.summary.high}</div>
            <div className="text-xs text-zinc-400">Risque eleve</div>
          </div>
          <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-amber-400">{data.summary.medium}</div>
            <div className="text-xs text-zinc-400">Risque moyen</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-black text-green-400">{data.summary.low}</div>
            <div className="text-xs text-zinc-400">Risque faible</div>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div className="mb-4">
        <Select value={level} onChange={setLevel} options={LEVEL_OPTIONS} placeholder="Tous niveaux" />
      </div>

      {/* Liste */}
      {data?.scores?.length === 0 ? (
        <div className="text-center py-10 text-zinc-500">Aucun score calcule. Cliquez sur Recalculer.</div>
      ) : (
        <div className="space-y-2">
          {data?.scores?.map((s: any) => (
            <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold">{s.full_name}</div>
                <div className="text-xs text-zinc-400">{s.member_code} &middot; {s.email || s.phone} &middot; {s.status}</div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="text-xl font-black">{s.score}<span className="text-xs text-zinc-500">/100</span></div>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${riskColor(s.risk_level)}`}>{s.risk_level}</span>
                <Link to={`/g/${slug}/admin/membres/${s.user_id}/crm`} className="text-amber-400 text-xs hover:text-amber-300">CRM</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
