import { ChevronLeft } from "lucide-react";

export function BoutonRetour({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-zinc-400 hover:text-white text-sm flex items-center gap-1 transition">
      <ChevronLeft size={16} /> Retour
    </button>
  );
}
