"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/motion";

export interface SpinPosterProps {
  /** Static poster image src. Defaults to brand mark. */
  src?: string;
  /** Optional frame sequence; when provided, `frame` selects the visible frame. */
  frames?: string[];
  /** Frame index to display when `frames` is provided. */
  frame?: number;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  /** Label for assistive tech / debugging. */
  label?: string;
  /** Force showing poster even on capable devices (e.g. reduced-motion). */
  forceStatic?: boolean;
}

/**
 * Lightweight static poster fallback for the HORIZON "spin" hero.
 * Used on small screens, touch devices, and when prefers-reduced-motion is set
 * instead of mounting the heavier canvas implementation.
 */
export default function SpinPoster({
  src,
  frames,
  frame = 0,
  alt = "HORIZON logo",
  width = 512,
  height = 512,
  className,
  priority = false,
  label,
  forceStatic = false,
}: SpinPosterProps) {
  const reducedMotion = useReducedMotion();
  const [resolvedSrc, setResolvedSrc] = useState<string>(
    frames && frames.length ? frames[Math.min(frame, frames.length - 1)] : src ?? "/brand/horizon-mark-512.png",
  );

  useEffect(() => {
    const next =
      frames && frames.length ? frames[Math.min(frame, frames.length - 1)] : src ?? "/brand/horizon-mark-512.png";
    setResolvedSrc(next);
  }, [src, frames, frame]);

  return (
    <figure
      className={className}
      data-spin-poster="true"
      data-static={forceStatic || reducedMotion ? "true" : "false"}
      aria-label={label ?? "HORIZON logo poster"}
      style={{ margin: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvedSrc}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        draggable={false}
        style={{
          display: "block",
          maxWidth: "100%",
          height: "auto",
          userSelect: "none",
        }}
      />
    </figure>
  );
}

export { SpinPoster };
export type { SpinPosterProps as SpinPosterComponentProps };
