"use client";

import * as React from "react";

export type HorizonHeroTextSize = "sm" | "md" | "lg" | "xl";

export interface HorizonHeroTextProps {
  /** Additional classes merged onto the overlay root. */
  className?: string;
  /** Responsive size preset. Defaults to "lg". */
  size?: HorizonHeroTextSize;
  /** Override the displayed wordmark. Defaults to "HORIZON AI". */
  label?: string;
  /** When true, dim the mark slightly for use over busy backgrounds. */
  muted?: boolean;
}

/**
 * SA-08 -- Static hero wordmark ("HORIZON AI").
 *
 * Positioned absolutely so it can overlay a spinning logo/mark without
 * inheriting or participating in the spin. The root is intentionally given
 * no rotation and no animation: it stays fixed while any sibling logo
 * rotates beneath/around it.
 *
 * Uses the display face and a single restrained accent (HORIZON blue on
 * the "AI" token only). No gradient text, no hero gradient.
 */
export const horizonHeroTextSizes: Record<HorizonHeroTextSize, string> = {
  sm: "text-2xl sm:text-3xl md:text-4xl",
  md: "text-3xl sm:text-4xl md:text-5xl",
  lg: "text-5xl sm:text-6xl md:text-7xl",
  xl: "text-6xl sm:text-7xl md:text-8xl lg:text-9xl",
};

const HorizonHeroText = React.forwardRef<HTMLDivElement, HorizonHeroTextProps>(
  ({ className, size = "lg", label = "HORIZON AI", muted = false }, ref) => {
    const textSize = horizonHeroTextSizes[size];

    return (
      <div
        ref={ref}
        className={[
          "absolute inset-0 z-20 flex items-center justify-center",
          "text-center select-none pointer-events-none",
          // Absolutely positioned overlay; deliberately no rotation/animation.
          "rotate-0",
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={label}
        role="img"
      >
        <span
          className={[
            textSize,
            "font-display font-semibold leading-none tracking-tight",
            muted ? "opacity-80" : "opacity-100",
            "text-fg",
          ].join(" ")}
        >
          HORIZON{" "}
          <span className="text-accent" aria-hidden="false">
            AI
          </span>
        </span>
      </div>
    );
  }
);

HorizonHeroText.displayName = "HorizonHeroText";

export { HorizonHeroText };
export default HorizonHeroText;