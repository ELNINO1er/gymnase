import type { ReactNode } from "react";

export function NavBtn({ actif, onClick, icone, label }: {
  actif: boolean;
  onClick: () => void;
  icone: ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition ${
        actif ? "bg-amber-400 text-zinc-950" : "text-zinc-400 hover:text-white hover:bg-zinc-800"
      }`}>
      {icone}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
