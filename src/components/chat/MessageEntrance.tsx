"use client";

import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/motion";
import type { ReactNode } from "react";

export type MessageEntranceProps = {
  /** Message content to animate. */
  children: ReactNode;
  /** Visual role used for subtle directional bias. */
  role?: "user" | "assistant";
  /** Optional animation delay in seconds. */
  delay?: number;
  className?: string;
};

export function MessageEntrance({
  children,
  role = "assistant",
  delay = 0,
  className,
}: MessageEntranceProps) {
  const reduced = usePrefersReducedMotion();
  const fromX = role === "user" ? 10 : -6;

  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 10, x: fromX }}
      animate={reduced ? undefined : { opacity: 1, y: 0, x: 0 }}
      transition={
        reduced
          ? undefined
          : { duration: 0.26, delay, ease: [0.22, 1, 0.36, 1] }
      }
    >
      {children}
    </motion.div>
  );
}

/** Convenience aliases for consumers. */
export const AnimatedMessage = MessageEntrance;
export const EntranceMotion = MessageEntrance;
export const MessageAnimation = MessageEntrance;

export default MessageEntrance;