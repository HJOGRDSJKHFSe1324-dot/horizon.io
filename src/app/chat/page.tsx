"use client";
import Nav from "@/components/Nav";
import { useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Copy, Trash2, Plus, Send, RefreshCw, Pencil, Square } from "lucide-react";
import MarkdownContent from "@/components/chat/MarkdownContent";
import Dropdown from "@/components/Dropdown";
import { siteCopy } from "@/content/site-copy";
import { useChatStore } from "@/lib/chat-store";
import { useChatStream } from "@/hooks/useChatStream";
import ChatEmptyState from "@/components/chat/ChatEmptyState";

function useCountdown(iso: string | null) {
  const [label, setLabel] = useStateLocal(iso);
  return label;
}

// keep simple local state helper for countdown only
import { useState } from "react";
function useStateLocal(iso: string | null) {
  // placeholder replaced below
  return iso ? "" : "";
}

export default function ChatPage() {
  return null;
}
