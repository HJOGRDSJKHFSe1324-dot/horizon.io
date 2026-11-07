"use client";

import React from "react";
import {
  useFramePreloader,
  createFrameCache,
  globalFrameCache,
  type FrameManifestInput,
  type FramePreloadOptions,
  type FrameCache,
} from "@/lib/frameLoader";

export interface FrameLoaderProps {
  manifest: FrameManifestInput;
  cache?: FrameCache;
  options?: FramePreloadOptions;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
  renderOverlay?: (state: ReturnType<typeof useFramePreloader>) => React.ReactNode;
}

export function FrameLoader({
  manifest,
  cache,
  options,
  className,
  style,
  alt = "Animated HORIZON logo frame",
  showPercentage = true,
  children,
  renderOverlay,
}: FrameLoaderProps) {
  const state = useFramePreloader(manifest, { ...options, cache: cache ?? options?.cache });
  const displayFrame = state.firstFrame ?? state.frames.find(Boolean) ?? null;

  return (
    <div
      className={className}
      style={{ position: "relative", overflow: "hidden", ...style }}
      aria-busy={!state.isComplete}
    >
      {displayFrame ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayFrame.src}
          alt={alt}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          decoding="async"
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            minHeight: 240,
            background: "var(--surface, #1A1E28)",
          }}
          aria-hidden="true"
        />
      )}

      {!state.isComplete && showPercentage ? (
        <div
          role="progressbar"
          aria-valuenow={Math.round(state.progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Loading frames"
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: 12,
            fontVariantNumeric: "tabular-nums",
            backdropFilter: "blur(4px)",
          }}
        >
          {Math.round(state.progress)}%
        </div>
      ) : null}

      {renderOverlay ? renderOverlay(state) : null}
      {children}
    </div>
  );
}

export { createFrameCache, globalFrameCache, useFramePreloader };
export default FrameLoader;