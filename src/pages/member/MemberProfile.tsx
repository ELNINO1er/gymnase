import { useState } from "react";
import { Check, User } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { authApi } from "../../services/api";

export function MemberProfile() {
  const { user, subscription, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    sport_goal: user?.sport_goal || "",
  });
  const [passwordForm, setPasswordForm] = useState({ current: "", new_password: "" });
  const [message, setMessage] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await authApi.updateProfile({
        full_name: form.full_name,
        email: form.email || undefined,
        phone: form.phone,
        sport_goal: form.sport_goal || undefined,
      });
      await refreshUser();
      setMessage({ type: "success", text: "Profil mis a jour" });
      setEditing(false);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.response?.data?.error || "Erreur" });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.current || !passwordForm.new_password) {
      setMessage({ type: "error", text: "Remplissez les deux champs" });
      return;
    }
    if (passwordForm.new_password.length < 6) {
      setMessage({ type: "error", text: "Minimum 6 caracteres" });
      return;
    }
    setSaving(true);
    setMessage({ type: "", text: "" });
    try {
      await authApi.changePassword(passwordForm.current, passwordForm.new_password);
      setMessage({ type: "success", text: "Mot de passe modifie" });
      setPasswordForm({ current: "", new_password: "" });
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || err.response?.data?.error || "Erreur" });
    }
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Mon profil</h1>

      {message.text && (
        <div className={`rounded-xl p-3 mb-5 text-sm ${message.type === "success" ? "bg-green-500/10 border border-green-500/30 text-green-400" : "bg-red-500/10 border border-red-500/30 text-red-400"}`}>
          {message.text}
        </div>
      )}

      {/* Info profil */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">Informations</h2>
          <button onClick={() => setEditing(!editing)} className="text-sm text-amber-400 hover:text-amber-300">
            {editing ? "Annuler" : "Modifier"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Nom complet</label>
              <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Telephone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Objectif sportif</label>
              <input value={form.sport_goal} onChange={(e) => setForm({ ...form, sport_goal: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 focus:border-amber-400 focus:outline-none" />
            </div>
            <button onClick={handleSaveProfile} disabled={saving}
              className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold px-5 py-2.5 rounded-lg transition">
              {saving ? "..." : "Enregistrer"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-zinc-400">Nom</span><span className="font-medium">{user?.full_name}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Telephone</span><span className="font-medium">{user?.phone}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Email</span><span className="font-medium">{user?.email || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Code membre</span><span className="font-mono text-amber-400">{user?.member_code}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Objectif</span><span className="font-medium">{user?.sport_goal || "—"}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Statut</span><span className="font-medium">{user?.status}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Membre depuis</span><span className="font-medium">{user?.created_at ? new Date(user.created_at).toLocaleDateString("fr-FR") : "—"}</span></div>
          </div>
        )}
      </div>

      {/* Abonnement */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-6">
        <h2 className="font-bold text-lg mb-3">Abonnement</h2>
        {subscription ? (
          <div>
            <div className="flex justify-between"><span className="text-zinc-400">Plan</span><span className="font-bold text-amber-400">{subscription.plan_name}</span></div>
            <div className="flex justify-between mt-2"><span className="text-zinc-400">Debut</span><span>{new Date(subscription.start_date).toLocaleDateString("fr-FR")}</span></div>
            <div className="flex justify-between mt-2"><span className="text-zinc-400">Expiration</span><span>{new Date(subscription.end_date).toLocaleDateString("fr-FR")}</span></div>
            <div className="flex justify-between mt-2"><span className="text-zinc-400">Statut</span><span className="text-green-400 font-medium">{subscription.status}</span></div>
          </div>
        ) : (
          <p className="text-zinc-500">Aucun abonnement actif</p>
        )}
      </div>

      {/* Changement mot de passe */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-3">Changer le mot de passe</h2>
        <div className="space-y-3">
          <input type="password" placeholder="Mot de passe actuel" value={passwordForm.current}
            onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 focus:border-amber-400 focus:outline-none" />
          <input type="password" placeholder="Nouveau mot de passe (min 6 car.)" value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2.5 focus:border-amber-400 focus:outline-none" />
          <button onClick={handleChangePassword} disabled={saving}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium px-5 py-2.5 rounded-lg transition">
            Modifier le mot de passe
          </button>
        </div>
      </div>
    </div>
  );
}
