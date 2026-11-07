"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type DropdownOption = {
  value: string;
  label: string;
  disabled?: boolean;
  hint?: string;
};

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder = "Select",
  className = "",
  size = "sm",
  placement = "down",
}: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
  placement?: "up" | "down";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);
  const rise = placement === "up";
  const menuPlacement = rise ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const yFrom = rise ? 4 : -4;

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const sizes = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-lg border bg-white/5 ${sizes} transition-all duration-150 hover:bg-white/10 hover:border-cyan-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 ${open ? "border-cyan-400/50 bg-white/10" : "border-white/10"}`}
      >
        <span className="truncate max-w-[160px]">{selected?.label || placeholder}</span>
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${open ? (rise ? "-rotate-180" : "rotate-180") + " text-cyan-300" : "text-slate-400"}`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, scale: 0.96, y: yFrom }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: yFrom }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-50 ${menuPlacement} min-w-full max-h-72 overflow-auto rounded-xl border border-white/10 bg-[#0b0f1a]/95 backdrop-blur-lg p-1.5 shadow-2xl shadow-black/40`}
            role="listbox"
          >
            {options.map((opt) => {
              const active = opt.value === value;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    disabled={opt.disabled}
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition duration-100 ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-cyan-500/15 hover:translate-x-0.5"
                    } ${active ? "bg-cyan-500/10 text-cyan-200" : "text-slate-200"}`}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.hint && <span className="text-[10px] text-slate-500">{opt.hint}</span>}
                    {active && <Check size={12} className="text-cyan-300" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}