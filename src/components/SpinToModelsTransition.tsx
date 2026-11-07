"use client";

import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

export interface SpinToModelsTransitionProps {
  /** Content revealed as the hand-off completes (typically the models sections). */
  children?: React.ReactNode;
  /** Visual representing the final spinning frame; faded/scaled out on hand-off. */
  finalFrame?: React.ReactNode;
  /** Negative overlap applied so the models container overlaps the preceding spin. */
  overlapPx?: number;
  className?: string;
  finalFrameClassName?: string;
  contentClassName?: string;
}

/**
 * SA-11 — Transition between the final spinning logo frame and the models section.
 *
 * Preserves the page background (no opaque panel is painted over the spin) while
 * overlapping containers and cross-fading / scaling the outgoing final frame
 * against the incoming models content. Reduced-motion users skip the animation.
 */
export default function SpinToModelsTransition({
  children,
  finalFrame,
  overlapPx = 96,
  className,
  finalFrameClassName,
  contentClassName,
}: SpinToModelsTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      setVisible(true);
      return;
    }
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const duration = reducedMotion ? 0 : 700;
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";
  const finalStyle: React.CSSProperties = reducedMotion
    ? { opacity: 0, transform: "none" }
    : {
        opacity: visible ? 0 : 1,
        transform: visible ? "scale(0.86)" : "scale(1)",
        transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`,
      };
  const contentStyle: React.CSSProperties = reducedMotion
    ? { opacity: 1, transform: "none" }
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.96)",
        transition: `opacity ${duration}ms ${easing}, transform ${duration}ms ${easing}`,
      };

  return (
    <div
      ref={containerRef}
      className={["relative bg-transparent", className].filter(Boolean).join(" ")}
      style={{ marginTop: `-${overlapPx}px` }}
    >
      {finalFrame ? (
        <div
          aria-hidden="true"
          className={[
            "pointer-events-none absolute left-1/2 z-0 w-[min(440px,80vw)] -translate-x-1/2",
            finalFrameClassName,
          ]
            .filter(Boolean)
            .join(" ")}
          style={{ top: overlapPx, ...finalStyle }}
        >
          {finalFrame}
        </div>
      ) : null}
      <div className={["relative z-10", contentClassName].filter(Boolean).join(" ")} style={contentStyle}>
        {children}
      </div>
    </div>
  );
}

export { SpinToModelsTransition };
export type { SpinToModelsTransitionProps as SpinToModelsTransitionComponentProps };
