"use client";

import { Plus } from "lucide-react";
import clsx from "clsx";

export type NewConversationButtonProps = {
  onClick?: () => void | Promise<void>;
  label?: string;
  disabled?: boolean;
  className?: string;
};

export function NewConversationButton({
  onClick,
  label = "New chat",
  disabled = false,
  className,
}: NewConversationButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onClick?.()}
      disabled={disabled}
      className={clsx(
        "flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium text-fg transition duration-150 hover:border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <Plus size={16} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default NewConversationButton;
