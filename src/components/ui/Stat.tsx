export function Stat({ titre, valeur }: { titre: string; valeur: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-sm text-zinc-400">{titre}</div>
      <div className="text-2xl font-black text-amber-400 mt-1">{valeur}</div>
    </div>
  );
}
