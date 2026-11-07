"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";
import { siteCopy } from "@/content/site-copy";

export type ChatEmptyStateProps = {
  /** Headline shown when there are no messages. */
  title?: string;
  /** Supporting sentence below the headline. */
  body?: string;
  /** Suggested prompts rendered as chips. Defaults to centralised copy. */
  prompts?: readonly string[];
  /** Helper text below the prompt chips. Pass `null` to hide. */
  promptHint?: string | null;
  /** Fired when a suggested prompt is clicked. */
  onPromptSelect?: (prompt: string) => void;
  /** Alias for onPromptSelect. */
  onSelectPrompt?: (prompt: string) => void;
  /** Alias for onPromptSelect. */
  onPromptClick?: (prompt: string) => void;
  className?: string;
};

export function ChatEmptyState({
  title,
  body,
  prompts,
  promptHint,
  onPromptSelect,
  onSelectPrompt,
  onPromptClick,
  className,
}: ChatEmptyStateProps) {
  const reduced = usePrefersReducedMotion();
  const items = prompts ?? siteCopy.chat.suggestedPrompts;
  const handlePrompt =
    onPromptSelect ?? onSelectPrompt ?? onPromptClick;
  const hint =
    promptHint === undefined ? siteCopy.chat.emptyStatePromptHint : promptHint;

  return (
    <motion.div
      className={`mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 py-16 text-center ${className ?? ""}`}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={reduced ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="space-y-2">
        <h2 className="font-display text-[1.5rem] font-medium tracking-tight text-fg">
          {title ?? siteCopy.chat.emptyTitle}
        </h2>
        <p className="text-sm text-muted">{body ?? siteCopy.chat.emptyBody}</p>
      </div>

      {items.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {items.map((prompt, idx) => (
            <motion.button
              key={prompt}
              type="button"
              onClick={() => handlePrompt?.(prompt)}
              className="rounded-full border border-default bg-surface-2 px-3 py-1.5 text-xs text-fg transition duration-150 hover:border-strong hover:bg-surface"
              initial={reduced ? false : { opacity: 0, y: 8 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{
                duration: 0.24,
                delay: reduced ? 0 : 0.06 + idx * 0.04,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      )}

      {hint ? <p className="text-xs text-subtle">{hint}</p> : null}
    </motion.div>
  );
}

export default ChatEmptyState;