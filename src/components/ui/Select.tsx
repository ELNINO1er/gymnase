import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ value, onChange, options, placeholder = "Selectionner..." }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  // Fermer au clic exterieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fermer avec Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between gap-2 w-full min-w-[160px] bg-zinc-950 border rounded-lg px-3 py-2 text-sm transition
          ${open ? "border-amber-400 ring-1 ring-amber-400/30" : "border-zinc-700 hover:border-zinc-500"}`}>
        <span className={`min-w-0 flex-1 truncate text-left ${selectedOption ? "text-zinc-100" : "text-zinc-500"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-amber-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-[180px] max-h-64 overflow-y-auto bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/50 py-1">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`flex items-center justify-between gap-3 w-full px-3 py-2 text-left text-sm transition
                  ${isSelected
                    ? "bg-amber-400/10 text-amber-400 font-medium"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-amber-400"
                  }`}>
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {isSelected && <Check size={14} className="shrink-0 text-amber-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
