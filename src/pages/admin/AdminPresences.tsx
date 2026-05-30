import { useEffect, useState } from "react";
import { attendanceApi } from "../../services/api";
import { DoorOpen, LogIn, LogOut, Clock } from "lucide-react";

export function AdminPresences() {
  const [inGym, setInGym] = useState<any[]>([]);
  const [todayLogs, setTodayLogs] = useState<any>(null);
  const [checkUserId, setCheckUserId] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [gymRes, todayRes] = await Promise.all([attendanceApi.getInGym(), attendanceApi.getToday()]);
      setInGym(gymRes.data.data.members);
      setTodayLogs(todayRes.data.data);
    } catch {}
    setLoading(false);
  };

  const handleCheckIn = async () => {
    if (!checkUserId) return;
    try {
      const { data } = await attendanceApi.checkIn(Number(checkUserId));
      setMsg({ type: "success", text: data.message || "Check-in effectue" });
      setCheckUserId("");
      loadData();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Erreur" });
    }
  };

  const handleCheckOut = async (userId: number) => {
    try {
      await attendanceApi.checkOut(userId);
      setMsg({ type: "success", text: "Check-out effectue" });
      loadData();
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Erreur" });
    }
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Presences</h1>

      {msg.text && (
        <div className={`rounded-xl p-3 mb-4 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</div>
      )}

      {/* Check-in manuel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6 flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-zinc-400 mb-1">Check-in manuel (ID membre)</label>
          <input value={checkUserId} onChange={(e) => setCheckUserId(e.target.value)} placeholder="ID du membre"
            onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:border-amber-400 focus:outline-none" />
        </div>
        <button onClick={handleCheckIn} className="bg-green-500 hover:bg-green-400 text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-1">
          <LogIn size={14} /> Entree
        </button>
      </div>

      {/* En salle maintenant */}
      <div className="bg-zinc-900 border border-green-500/30 rounded-2xl p-5 mb-6">
        <h2 className="font-bold mb-3 flex items-center gap-2"><DoorOpen size={18} className="text-green-400" /> En salle maintenant ({inGym.length})</h2>
        {inGym.length === 0 ? (
          <p className="text-zinc-500 text-sm">Personne dans la salle</p>
        ) : (
          <div className="space-y-2">
            {inGym.map((m) => (
              <div key={m.id} className="bg-zinc-950 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">{m.full_name}</div>
                  <div className="text-xs text-zinc-500">{m.member_code} &middot; Entree {new Date(m.check_in_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} &middot; {m.method}</div>
                </div>
                <button onClick={() => handleCheckOut(m.user_id)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
                  <LogOut size={12} /> Sortie
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historique du jour */}
      {todayLogs && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <h2 className="font-bold mb-1 flex items-center gap-2"><Clock size={18} className="text-amber-400" /> Aujourd'hui</h2>
          <div className="text-sm text-zinc-400 mb-3">{todayLogs.stats.total_entries} entree(s) &middot; {todayLogs.stats.denied} refusee(s) &middot; {todayLogs.stats.currently_in} encore en salle</div>
          {todayLogs.logs.length === 0 ? <p className="text-zinc-500 text-sm">Aucune entree</p> : (
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {todayLogs.logs.map((log: any) => (
                <div key={log.id} className={`flex items-center justify-between text-sm py-2 border-b border-zinc-800 last:border-0 ${log.status === "DENIED" ? "opacity-50" : ""}`}>
                  <div>
                    <span className="font-medium">{log.full_name}</span>
                    <span className="text-xs text-zinc-500 ml-2">{log.member_code}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-zinc-400">
                    <span>{new Date(log.check_in_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {log.check_out_time && <span>→ {new Date(log.check_out_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>}
                    <span className={log.status === "VALID" ? "text-green-400" : "text-red-400"}>{log.status}</span>
                    {log.reason && <span className="text-red-400">{log.reason}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
