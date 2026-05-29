import { useEffect, useState } from "react";
import { Calendar, Check, Clock, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { reservationsApi } from "../../services/api";

export function MemberReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [sessionId, setSessionId] = useState(0);
  const [date, setDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    loadData();
    reservationsApi.getSessions().then(({ data }) => setSessions(data.data)).catch(() => {});
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data } = await reservationsApi.getUserReservations(user.id, false);
      setReservations(data.data);
    } catch {}
    setLoading(false);
  };

  const loadSlots = async (sid: number, d: string) => {
    if (!sid || !d) { setSlots([]); return; }
    try {
      const { data } = await reservationsApi.getAvailableSlots(sid, d);
      setSlots(data.data.slots || []);
    } catch { setSlots([]); }
  };

  const handleSessionChange = (id: number) => {
    setSessionId(id);
    setSelectedSlot(null);
    if (date) loadSlots(id, date);
  };

  const handleDateChange = (d: string) => {
    setDate(d);
    setSelectedSlot(null);
    if (sessionId) loadSlots(sessionId, d);
  };

  const handleReserve = async () => {
    if (!selectedSlot || !sessionId || !date) return;
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await reservationsApi.create({
        session_id: sessionId,
        reservation_date: date,
        start_time: selectedSlot.start_time.slice(0, 5),
        end_time: selectedSlot.end_time.slice(0, 5),
        time_slot_id: selectedSlot.id,
      });
      setMessage({ type: "success", text: "Seance reservee avec succes !" });
      setShowForm(false);
      setSessionId(0);
      setDate("");
      setSelectedSlot(null);
      setSlots([]);
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Erreur lors de la reservation" });
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Annuler cette reservation ?")) return;
    try {
      await reservationsApi.cancel(id);
      setMessage({ type: "success", text: "Reservation annulee" });
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.error || "Impossible d'annuler" });
    }
  };

  const upcoming = reservations.filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW" && new Date(r.reservation_date) >= new Date(today));
  const past = reservations.filter((r) => r.status === "COMPLETED" || r.status === "NO_SHOW" || new Date(r.reservation_date) < new Date(today));

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Mes reservations</h1>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Reserver
        </button>
      </div>

      {message.text && (
        <div className={`rounded-xl p-3 mb-5 text-sm flex items-center gap-2 ${message.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
          <Check size={16} /> {message.text}
        </div>
      )}

      {/* Formulaire reservation */}
      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Programmer une seance</h3>

          <label className="block text-sm font-medium text-zinc-300 mb-2">Type de seance</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
            {sessions.map((s: any) => (
              <button key={s.id} onClick={() => handleSessionChange(s.id)}
                className={`p-3 rounded-xl border text-center transition text-sm ${sessionId === s.id ? "border-amber-400 bg-amber-400/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-600"}`}>
                <div className="font-medium">{s.name}</div>
                <div className="text-xs text-zinc-500">{s.duration_minutes}min</div>
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-zinc-300 mb-2">Date</label>
          <input type="date" min={today} value={date} onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none mb-5 text-zinc-100" style={{ colorScheme: "dark" }} />

          {slots.length > 0 && (
            <>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Creneau horaire</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
                {slots.map((slot: any) => (
                  <button key={slot.id} disabled={slot.is_full}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-2.5 rounded-lg text-sm font-medium transition ${
                      slot.is_full ? "bg-zinc-800 text-zinc-600 cursor-not-allowed line-through"
                      : selectedSlot?.id === slot.id ? "bg-amber-400 text-zinc-950"
                      : "bg-zinc-950 border border-zinc-700 hover:border-amber-400"
                    }`}>
                    {slot.start_time.slice(0, 5)}
                    {!slot.is_full && <div className="text-xs opacity-60">{slot.available} place{slot.available > 1 ? "s" : ""}</div>}
                  </button>
                ))}
              </div>
            </>
          )}

          {date && slots.length === 0 && sessionId > 0 && (
            <p className="text-zinc-500 text-sm mb-5">Aucun creneau disponible pour ce jour.</p>
          )}

          <button onClick={handleReserve} disabled={!selectedSlot || submitting}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-3 rounded-lg transition">
            {submitting ? "Reservation..." : "Confirmer la reservation"}
          </button>
        </div>
      )}

      {/* Prochaines reservations */}
      <h2 className="text-lg font-bold mb-3">A venir ({upcoming.length})</h2>
      {upcoming.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center mb-8">
          <Calendar className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucune seance a venir</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {upcoming.map((r) => (
            <div key={r.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="font-bold">{r.session_name}</div>
                <div className="text-sm text-zinc-400 flex items-center gap-3 mt-0.5">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(r.reservation_date).toLocaleDateString("fr-FR")}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {r.start_time.slice(0, 5)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "CONFIRMED" ? "bg-green-500/10 text-green-400" : "bg-amber-400/10 text-amber-400"}`}>{r.status}</span>
                <button onClick={() => handleCancel(r.id)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1 mt-2 ml-auto">
                  <Trash2 size={14} /> Annuler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Historique */}
      {past.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">Historique ({past.length})</h2>
          <div className="space-y-2">
            {past.slice(0, 10).map((r) => (
              <div key={r.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between opacity-70">
                <div>
                  <div className="font-medium text-sm">{r.session_name}</div>
                  <div className="text-xs text-zinc-500">{new Date(r.reservation_date).toLocaleDateString("fr-FR")} {r.start_time.slice(0, 5)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.status === "COMPLETED" ? "bg-green-500/10 text-green-400" : r.status === "NO_SHOW" ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
