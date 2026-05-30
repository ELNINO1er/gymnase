import { useState } from "react";
import { Download } from "lucide-react";
import { exportsApi } from "../../services/api";

export function AdminExports() {
  const [loading, setLoading] = useState("");

  const download = async (type: string, filename: string, fetcher: () => Promise<any>) => {
    setLoading(type);
    try {
      const { data } = await fetcher();
      const blob = new Blob([data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch {}
    setLoading("");
  };

  const exports = [
    { key: "members", label: "Liste des membres", desc: "Nom, email, telephone, role, statut, code membre", fn: () => exportsApi.members() },
    { key: "payments", label: "Paiements", desc: "Montant, methode, statut, reference, date", fn: () => exportsApi.payments() },
    { key: "reservations", label: "Reservations", desc: "Membre, seance, date, heure, statut", fn: () => exportsApi.reservations() },
    { key: "attendance", label: "Presences", desc: "Membre, check-in, check-out, methode, statut", fn: () => exportsApi.attendance() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Exports</h1>
      <p className="text-zinc-400 text-sm mb-6">Telecharger vos donnees au format CSV (compatible Excel).</p>

      <div className="grid sm:grid-cols-2 gap-4">
        {exports.map((exp) => (
          <div key={exp.key} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="font-bold mb-1">{exp.label}</h3>
            <p className="text-xs text-zinc-500 mb-4">{exp.desc}</p>
            <button
              onClick={() => download(exp.key, `${exp.key}_${new Date().toISOString().split("T")[0]}.csv`, exp.fn)}
              disabled={loading === exp.key}
              className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-700 text-zinc-950 font-bold px-4 py-2.5 rounded-lg text-sm transition">
              <Download size={16} /> {loading === exp.key ? "Export..." : "Telecharger CSV"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
