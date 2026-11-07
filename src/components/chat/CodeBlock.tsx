"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

export interface CodeBlockProps {
  code: string;
  language?: string;
  className?: string;
}

export default function CodeBlock({ code, language, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lang = (language || "text").trim().toLowerCase() || "text";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard may be unavailable; fail silently.
    }
  }, [code]);

  return (
    <div
      className={`my-3 rounded-lg border border-white/10 bg-black/30 overflow-hidden ${
        className ?? ""
      }`}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-slate-400 bg-white/5">
        <span className="font-mono tracking-wide">{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors"
          aria-label="Copy code to clipboard"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <SyntaxHighlighter
        language={lang}
        style={oneDark}
        PreTag="pre"
        showLineNumbers={false}
        customStyle={{
          margin: 0,
          background: "transparent",
          padding: "0.75rem 1rem",
          fontSize: "0.85rem",
          lineHeight: 1.55,
          overflowX: "auto",
        }}
        codeTagProps={{
          style: {
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace)",
          },
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
