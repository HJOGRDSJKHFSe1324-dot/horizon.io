"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ComponentPropsWithoutRef } from "react";
import dynamic from "next/dynamic";
const CodeBlock = dynamic(() => import("./CodeBlock"), { ssr: false });

export interface MarkdownContentProps {
  content: string;
  streaming?: boolean;
  className?: string;
}

/**
 * Closes a trailing, unclosed fenced code block while streaming so partial
 * code renders as a highlighted block instead of collapsing into text.
 */
function normalizeStreamingContent(content: string, streaming?: boolean): string {
  if (!streaming) return content;
  const fenceCount = (content.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) return `${content}\n\`\`\``;
  return content;
}

export default function MarkdownContent({
  content,
  streaming = false,
  className,
}: MarkdownContentProps) {
  const normalized = normalizeStreamingContent(content || "", streaming);

  const remarkPlugins = useMemo(() => [remarkGfm], []);
  const components = useMemo(
    () => ({
      code({ className, children, node: _node, ...props }: ComponentPropsWithoutRef<"code"> & { node?: unknown }) {
        const match = /language-(\w+)/.exec(className || "");
        if (!match) {
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
        const text = String(children).replace(/\n$/, "");
        return <CodeBlock code={text} language={match[1]} />;
      },
      pre({ children }: ComponentPropsWithoutRef<"pre">) {
        return <>{children}</>;
      },
      a({ children, href, node: _node, ...props }: ComponentPropsWithoutRef<"a"> & { node?: unknown }) {
        return (
          <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
          </a>
        );
      },
      img({ node: _node, ...props }: ComponentPropsWithoutRef<"img"> & { node?: unknown }) {
        // eslint-disable-next-line jsx-a11y/alt-text
        return <img loading="lazy" {...props} />;
      },
    }),
    [],
  );

  return (
    <div
      className={`markdown ${className ?? ""}`}
      style={{ minHeight: streaming && !content ? "1.25rem" : undefined }}
    >
      <ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
        {normalized || (streaming ? "…" : "")}
      </ReactMarkdown>
    </div>
  );
}

export { MarkdownContent };