"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import clsx from "clsx";

export type ConversationSearchProps = {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function ConversationSearch({
  value,
  defaultValue = "",
  onChange,
  placeholder = "Search conversations",
  className,
  disabled = false,
}: ConversationSearchProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);

  useEffect(() => {
    if (!controlled) setInternal(defaultValue);
  }, [controlled, defaultValue]);

  const current = controlled ? value! : internal;

  function update(next: string) {
    if (!controlled) setInternal(next);
    onChange?.(next);
  }

  return (
    <div className={clsx("relative", className)}>
      <Search
        size={14}
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle"
      />
      <input
        type="search"
        value={current}
        disabled={disabled}
        onChange={(e) => update(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-8 text-sm text-fg placeholder:text-subtle transition duration-150 focus:border-strong focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50"
      />
      {current ? (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => update("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-subtle transition hover:text-fg"
        >
          <X size={12} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export default ConversationSearch;
