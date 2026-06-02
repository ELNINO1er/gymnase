import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Calendar, Check, Clock, Info, Plus, Trash2, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { reservationsApi } from "../../services/api";

const today = new Date().toISOString().split("T")[0];

function toTime(value?: string) {
  return value ? value.slice(0, 5) : "--:--";
}

function addMinutes(time: string, minutes: number) {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date(2026, 0, 1, hours || 0, mins || 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function MemberReservations() {
  const { user, subscription } = useAuth();
  const [reservations, setReservations] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [sessionId, setSessionId] = useState(0);
  const [date, setDate] = useState(today);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [manualStartTime, setManualStartTime] = useState("08:00");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const activeSubscription = Boolean(subscription);
  const selectedSession = useMemo(
    () => sessions.find((session) => Number(session.id) === Number(sessionId)),
    [sessions, sessionId]
  );
  const manualEndTime = selectedSession ? addMinutes(manualStartTime, Number(selectedSession.duration_minutes) || 60) : "";

  useEffect(() => {
    loadData();
    reservationsApi.getSessions().then(({ data }) => {
      const nextSessions = data.data || [];
      setSessions(nextSessions);
      if (nextSessions[0]?.id) {
        setSessionId(Number(nextSessions[0].id));
        loadSlots(Number(nextSessions[0].id), today);
      }
    }).catch(() => {});
  }, []);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data } = await reservationsApi.getUserReservations(user.id, false);
      setReservations(data.data || []);
    } catch {}
    setLoading(false);
  };

  const loadSlots = async (sid: number, d: string) => {
    if (!sid || !d) {
      setSlots([]);
      return;
    }
    try {
      const { data } = await reservationsApi.getAvailableSlots(sid, d);
      setSlots(data.data.slots || []);
    } catch {
      setSlots([]);
    }
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
    if (!sessionId || !date || !selectedSession || !activeSubscription) return;
    const start = selectedSlot ? toTime(selectedSlot.start_time) : manualStartTime;
    const end = selectedSlot ? toTime(selectedSlot.end_time) : manualEndTime;

    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      await reservationsApi.create({
        session_id: sessionId,
        reservation_date: date,
        start_time: start,
        end_time: end,
        ...(selectedSlot?.id ? { time_slot_id: selectedSlot.id } : {}),
      });
      setMessage({ type: "success", text: "Seance reservee avec succes." });
      setShowForm(false);
      setSelectedSlot(null);
      await loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.response?.data?.error || "Erreur lors de la reservation" });
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: number) => {
    if (!confirm("Annuler cette reservation ?")) return;
    try {
      await reservationsApi.cancel(id);
      setMessage({ type: "success", text: "Reservation annulee." });
      loadData();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.response?.data?.error || "Impossible d'annuler" });
    }
  };

  const upcoming = reservations.filter((r) => r.status !== "CANCELLED" && r.status !== "NO_SHOW" && new Date(r.reservation_date) >= new Date(today));
  const past = reservations.filter((r) => r.status === "COMPLETED" || r.status === "NO_SHOW" || new Date(r.reservation_date) < new Date(today));
  const canReserve = activeSubscription && sessionId > 0 && date && (selectedSlot || (slots.length === 0 && manualStartTime));

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Mes reservations</h1>
          <p className="text-sm text-zinc-500 mt-1">Choisissez une seance, une date et un horaire.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-4 py-2 rounded-lg transition">
          <Plus size={18} /> Reserver
        </button>
      </div>

      {!activeSubscription && (
        <div className="rounded-xl p-4 mb-5 bg-amber-400/10 border border-amber-400/30 text-amber-100 flex gap-3">
          <AlertCircle size={20} className="text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Abonnement requis pour reserver</div>
            <div className="text-sm text-amber-100/80 mt-1">
              Votre compte est valide, mais aucune souscription active n'est encore liee. Faites votre depot Wave puis demandez la validation a l'administration.
            </div>
            <Link to="/membre/paiements" className="text-sm font-bold text-amber-300 inline-block mt-2 hover:text-amber-200">
              Voir les consignes de paiement
            </Link>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`rounded-xl p-3 mb-5 text-sm flex items-center gap-2 ${message.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
          <Check size={16} /> {message.text}
        </div>
      )}

      {showForm && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">Programmer une seance</h3>

          <label className="block text-sm font-medium text-zinc-300 mb-2">Type de seance</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-5">
            {sessions.map((session: any) => (
              <button key={session.id} onClick={() => handleSessionChange(Number(session.id))}
                className={`p-3 rounded-xl border text-left transition text-sm ${sessionId === Number(session.id) ? "border-amber-400 bg-amber-400/10" : "border-zinc-700 bg-zinc-950 hover:border-zinc-600"}`}>
                <div className="font-bold">{session.name}</div>
                <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1"><Clock size={13} /> {session.duration_minutes || 60} min</span>
                  <span className="inline-flex items-center gap-1"><Users size={13} /> {session.capacity || 1} places</span>
                </div>
                {session.description && <div className="text-xs text-zinc-500 mt-2 line-clamp-2">{session.description}</div>}
              </button>
            ))}
          </div>

          <label className="block text-sm font-medium text-zinc-300 mb-2">Date</label>
          <input type="date" min={today} value={date} onChange={(e) => handleDateChange(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none mb-3 text-zinc-100" style={{ colorScheme: "dark" }} />

          {date && (
            <div className="text-sm text-zinc-400 mb-5">
              Selection : <span className="text-zinc-200">{formatDate(date)}</span>
              {selectedSession ? <span> · {selectedSession.name} · {selectedSession.duration_minutes || 60} min</span> : null}
            </div>
          )}

          {slots.length > 0 ? (
            <>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Creneau horaire configure</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                {slots.map((slot: any) => (
                  <button key={slot.id} disabled={slot.is_full}
                    onClick={() => setSelectedSlot(slot)}
                    className={`py-3 px-2 rounded-lg text-sm font-medium transition ${
                      slot.is_full ? "bg-zinc-800 text-zinc-600 cursor-not-allowed line-through"
                      : selectedSlot?.id === slot.id ? "bg-amber-400 text-zinc-950"
                      : "bg-zinc-950 border border-zinc-700 hover:border-amber-400"
                    }`}>
                    <div>{toTime(slot.start_time)} - {toTime(slot.end_time)}</div>
                    {!slot.is_full && <div className="text-xs opacity-70 mt-0.5">{slot.available} place{slot.available > 1 ? "s" : ""}</div>}
                  </button>
                ))}
              </div>
            </>
          ) : sessionId > 0 && date ? (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 mb-5">
              <div className="flex gap-2 text-sm text-zinc-300 mb-3">
                <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <span>Aucun creneau fixe n'est configure pour ce jour. Vous pouvez proposer un horaire libre, qui sera reserve si la capacite le permet.</span>
              </div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Heure souhaitee</label>
              <div className="grid sm:grid-cols-2 gap-3">
                <input type="time" value={manualStartTime} onChange={(e) => setManualStartTime(e.target.value)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 focus:border-amber-400 focus:outline-none text-zinc-100" style={{ colorScheme: "dark" }} />
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-400">
                  Fin estimee : <span className="text-zinc-100 font-bold">{manualEndTime || "--:--"}</span>
                </div>
              </div>
            </div>
          ) : null}

          <button onClick={handleReserve} disabled={!canReserve || submitting}
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 font-bold py-3 rounded-lg transition">
            {submitting ? "Reservation..." : activeSubscription ? "Confirmer la reservation" : "Activez un abonnement pour reserver"}
          </button>
        </div>
      )}

      <h2 className="text-lg font-bold mb-3">A venir ({upcoming.length})</h2>
      {upcoming.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center mb-8">
          <Calendar className="mx-auto text-zinc-600 mb-3" size={40} />
          <p className="text-zinc-400">Aucune seance a venir</p>
        </div>
      ) : (
        <div className="space-y-3 mb-8">
          {upcoming.map((reservation) => (
            <div key={reservation.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <div className="font-bold">{reservation.session_name}</div>
                <div className="text-sm text-zinc-400 flex flex-wrap gap-3 mt-1">
                  <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(reservation.reservation_date).toLocaleDateString("fr-FR")}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {toTime(reservation.start_time)} - {toTime(reservation.end_time)}</span>
                </div>
              </div>
              <div className="flex sm:flex-col items-center sm:items-end gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${reservation.status === "CONFIRMED" ? "bg-green-500/10 text-green-400" : "bg-amber-400/10 text-amber-400"}`}>{reservation.status}</span>
                <button onClick={() => handleCancel(reservation.id)} className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                  <Trash2 size={14} /> Annuler
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="text-lg font-bold mb-3">Historique ({past.length})</h2>
          <div className="space-y-2">
            {past.slice(0, 10).map((reservation) => (
              <div key={reservation.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 flex items-center justify-between opacity-80">
                <div>
                  <div className="font-medium text-sm">{reservation.session_name}</div>
                  <div className="text-xs text-zinc-500">{new Date(reservation.reservation_date).toLocaleDateString("fr-FR")} · {toTime(reservation.start_time)} - {toTime(reservation.end_time)}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${reservation.status === "COMPLETED" ? "bg-green-500/10 text-green-400" : reservation.status === "NO_SHOW" ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"}`}>{reservation.status}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
