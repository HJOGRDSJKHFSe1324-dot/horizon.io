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
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selected = options.find((o) => o.value === value);

  const selectableIndices = options
    .map((opt, i) => (opt.disabled ? -1 : i))
    .filter((i) => i >= 0);

  useEffect(() => {
    const idx = options.findIndex((o) => o.value === value);
    setActiveIndex(idx >= 0 ? idx : (selectableIndices[0] ?? 0));
  }, [value, options]);

  const rise = placement === "up";
  const menuPlacement = rise ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const yFrom = rise ? 4 : -4;

  useEffect(() => {
    function onPointer(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const moveActive = (delta: number) => {
    if (!selectableIndices.length) return;
    const pos = selectableIndices.indexOf(activeIndex);
    const nextPos = (pos + delta + selectableIndices.length) % selectableIndices.length;
    setActiveIndex(selectableIndices[nextPos]);
  };

  const commitActive = () => {
    const opt = options[activeIndex];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    setOpen(false);
    buttonRef.current?.focus();
  };

  const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "Enter":
      case " ":
      case "ArrowDown":
      case "ArrowUp":
        e.preventDefault();
        setOpen(true);
        break;
      default:
        break;
    }
  };

  const onMenuKeyDown = (e: React.KeyboardEvent<HTMLUListElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        moveActive(-1);
        break;
      case "Home":
        e.preventDefault();
        if (selectableIndices.length) setActiveIndex(selectableIndices[0]);
        break;
      case "End":
        e.preventDefault();
        if (selectableIndices.length) setActiveIndex(selectableIndices[selectableIndices.length - 1]);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commitActive();
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default:
        break;
    }
  };

  const sizes = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";

  return (
    <div ref={ref} className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={selected?.label || placeholder}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onButtonKeyDown}
        className={`flex items-center gap-1.5 rounded-lg border bg-white/5 ${sizes} transition-all duration-150 hover:bg-white/10 hover:border-blue-400/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 ${open ? "border-blue-400/50 bg-white/10" : "border-white/10"}`}
      >
        <span className="truncate max-w-[160px]">{selected?.label || placeholder}</span>
        <ChevronDown
          aria-hidden="true"
          size={12}
          className={`transition-transform duration-200 ${open ? (rise ? "-rotate-180" : "rotate-180") + " text-blue-300" : "text-slate-400"}`}
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
            aria-activedescendant={options[activeIndex] ? `dropdown-option-${activeIndex}` : undefined}
            tabIndex={-1}
            onKeyDown={onMenuKeyDown}
          >
            {options.map((opt, i) => {
              const active = opt.value === value;
              const highlighted = i === activeIndex;
              return (
                <li key={opt.value}>
                  <button
                    type="button"
                    id={`dropdown-option-${i}`}
                    disabled={opt.disabled}
                    role="option"
                    aria-selected={active}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setOpen(false);
                      buttonRef.current?.focus();
                    }}
                    onMouseEnter={() => {
                      if (!opt.disabled) setActiveIndex(i);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition duration-100 ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-blue-500/15 hover:translate-x-0.5"
                    } ${active ? "bg-blue-500/10 text-blue-200" : "text-slate-200"} ${highlighted ? "ring-1 ring-blue-400/50" : ""}`}
                  >
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.hint && <span className="text-[10px] text-slate-500">{opt.hint}</span>}
                    {active && <Check size={12} className="text-blue-300" aria-hidden="true" />}
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