import { useEffect, useState } from "react";
import { settingsApi } from "../../services/api";
import { Save, Settings } from "lucide-react";

export function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    settingsApi.getAll().then(({ data }) => { setSettings(data.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload: Record<string, string> = {};
    for (const [key, val] of Object.entries(settings)) {
      const v = val.value;
      payload[key] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }
    try {
      await settingsApi.update(payload);
      setMsg({ type: "success", text: "Configuration sauvegardee" });
    } catch (err: any) { setMsg({ type: "error", text: err.response?.data?.message || "Erreur" }); }
    setSaving(false);
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  const updateVal = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: { ...prev[key], value } }));
  };

  if (loading) return <div className="text-center py-10 text-zinc-400">Chargement...</div>;

  const groups = [
    { title: "Informations de la salle", keys: ["gym_name", "gym_phone", "gym_address", "gym_email", "gym_currency", "gym_logo_url"] },
    { title: "Paiement", keys: ["wave_payment_link"] },
    { title: "Regles", keys: ["cancellation_hours", "allow_trial_session"] },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings size={24} className="text-amber-400" /> Configuration</h1>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm">
          <Save size={16} /> {saving ? "..." : "Sauvegarder"}
        </button>
      </div>

      {msg.text && <div className={`rounded-xl p-3 mb-4 text-sm ${msg.type === "success" ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>{msg.text}</div>}

      {groups.map((group) => (
        <div key={group.title} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-5">
          <h2 className="font-bold mb-4">{group.title}</h2>
          <div className="space-y-4">
            {group.keys.map((key) => {
              const setting = settings[key];
              if (!setting) return null;
              return (
                <div key={key}>
                  <label className="block text-xs text-zinc-400 mb-1">{setting.description || key}</label>
                  {setting.type === "BOOLEAN" ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={setting.value === true || setting.value === "true"}
                        onChange={(e) => updateVal(key, e.target.checked)} className="rounded" />
                      <span className="text-sm">{setting.value ? "Active" : "Desactive"}</span>
                    </label>
                  ) : (
                    <input value={String(setting.value)} onChange={(e) => updateVal(key, e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
