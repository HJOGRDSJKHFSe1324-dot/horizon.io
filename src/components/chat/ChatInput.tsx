"use client";

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Paperclip, Send, Square, X, Command } from "lucide-react";
import {
  SLASH_COMMANDS,
  filterSlashCommands,
  isSlashCommandMode,
  parseSlashCommand,
  applySlashCommand,
  type SlashCommand,
} from "@/lib/slashCommands";

export type ChatInputAttachment = {
  id: string;
  fileName: string;
  mimeType?: string | null;
  sizeBytes?: number;
};

export type ChatInputProps = {
  value?: string;
  input?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onInput?: (value: string) => void;
  setInput?: (value: string) => void;
  onSubmit?: (value: string) => void | Promise<void>;
  onSend?: (value: string) => void | Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  streaming?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
  attachments?: ChatInputAttachment[];
  files?: ChatInputAttachment[];
  onFiles?: (files: File[]) => void;
  onAttach?: (files: File[]) => void;
  setFiles?: (files: File[]) => void;
  onRemoveAttachment?: (id: string) => void;
  onRemoveFile?: (id: string) => void;
  slashCommands?: SlashCommand[];
  enableSlashCommands?: boolean;
  onCommand?: (command: SlashCommand, args: string) => boolean | void | Promise<boolean | void>;
  autoFocus?: boolean;
  ariaLabel?: string;
  accept?: string;
  shortcuts?: boolean;
};

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(function ChatInput(props, ref) {
  const {
    value,
    input,
    defaultValue = "",
    onChange,
    onInput,
    setInput,
    onSubmit,
    onSend,
    disabled = false,
    loading = false,
    streaming,
    isStreaming,
    onStop,
    placeholder = "Message…",
    minRows = 1,
    maxRows = 8,
    className = "",
    attachments,
    files,
    onFiles,
    onAttach,
    setFiles,
    onRemoveAttachment,
    onRemoveFile,
    slashCommands,
    enableSlashCommands = true,
    onCommand,
    autoFocus = false,
    ariaLabel = "Message input",
    accept,
    shortcuts = true,
  } = props;

  const isControlled = value !== undefined || input !== undefined;
  const controlledValue = value ?? input;
  const [internalValue, setInternalValue] = useState(defaultValue);
  const text = isControlled ? (controlledValue ?? "") : internalValue;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashIndex, setSlashIndex] = useState(0);

  const resolvedStreaming = Boolean(streaming ?? isStreaming ?? loading);
  const submit = onSubmit ?? onSend;
  const attachmentList = attachments ?? files ?? [];
  const removeAttachment = onRemoveAttachment ?? onRemoveFile;
  const fileHandler = onFiles ?? onAttach;
  const commandList = slashCommands ?? SLASH_COMMANDS;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      // Controlled parents own state; keep internal mirror in sync best-effort.
      if (isControlled) setInternalValue(next);
      onChange?.(next);
      onInput?.(next);
      setInput?.(next);
    },
    [isControlled, onChange, onInput, setInput],
  );

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus();
  }, [autoFocus]);

  // Slash command menu visibility.
  useEffect(() => {
    if (!enableSlashCommands) {
      setSlashOpen(false);
      return;
    }
    if (isSlashCommandMode(text) && text.trimStart().startsWith("/")) {
      setSlashOpen(true);
      setSlashIndex(0);
    } else {
      setSlashOpen(false);
    }
  }, [text, enableSlashCommands]);

  const slashQuery = useMemo(() => {
    const v = text.trimStart();
    if (!v.startsWith("/")) return "";
    const after = v.slice(1);
    return after.split(/\s/)[0] ?? "";
  }, [text]);

  const filteredCommands = useMemo(() => {
    const base = filterSlashCommands(slashQuery);
    const names = new Set(commandList.map((c) => c.name));
    const allowed = commandList.length ? commandList : SLASH_COMMANDS;
    const filtered = base.filter((c) => (allowed === SLASH_COMMANDS ? true : names.has(c.name))) ;
    // Preserve caller-provided ordering when a custom list is given.
    if (commandList !== SLASH_COMMANDS && commandList.length) {
      const order = new Map(commandList.map((c, i) => [c.name, i]));
      return filtered.sort((a, b) => (order.get(a.name) ?? 999) - (order.get(b.name) ?? 999));
    }
    return filtered;
  }, [slashQuery, commandList]);

  const safeIndex = filteredCommands.length ? Math.min(slashIndex, filteredCommands.length - 1) : 0;
  const activeCommand = filteredCommands[safeIndex];

  const submitText = useCallback(
    async (raw?: string) => {
      const candidate = (raw ?? text).trim();
      if (!candidate || disabled || resolvedStreaming) return;
      await submit?.(candidate);
      if (!isControlled) setInternalValue("");
      else setValue("");
      setSlashOpen(false);
    },
    [text, disabled, resolvedStreaming, submit, isControlled, setValue],
  );

  function handleFiles(filesToHandle: FileList | File[] | null) {
    if (!filesToHandle) return;
    const arr = Array.from(filesToHandle as Iterable<File>);
    if (!arr.length) return;
    // Persist into File objects; parent is responsible for upload.
    fileHandler?.(arr);
    setFiles?.(arr);
    // Also support compound file input setFiles as state setter? Callers pass setters elsewhere.
  }

  async function selectSlashCommand(cmd: SlashCommand) {
    const parsed = parseSlashCommand(text);
    const handled = await onCommand?.(cmd, parsed.args);
    if (handled) {
      setValue("");
      setSlashOpen(false);
      textareaRef.current?.focus();
      return;
    }
    if (cmd.action === "clear") {
      setValue("");
    } else if (cmd.requiresArgs) {
      setValue(`/${cmd.name} `);
    } else if (cmd.payload) {
      setValue(cmd.payload);
    } else if (cmd.action === "submit" && cmd.payload) {
      setValue(cmd.payload);
    } else {
      const next = applySlashCommand(text, cmd);
      setValue(next);
    }
    setSlashOpen(false);
    // Defer focus to next tick so menu unmounts first.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Slash menu navigation takes priority while open.
    if (slashOpen && filteredCommands.length) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => (i + 1) % filteredCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        if (activeCommand) selectSlashCommand(activeCommand);
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        if (activeCommand && slashQuery && !text.trimStart().slice(1).includes(" ")) {
          e.preventDefault();
          selectSlashCommand(activeCommand);
          return;
        }
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setSlashOpen(false);
        return;
      }
    }

    const isMod = e.metaKey || e.ctrlKey;
    if (shortcuts && isMod && e.key === "Enter") {
      e.preventDefault();
      submitText();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !slashOpen) {
      e.preventDefault();
      submitText();
      return;
    }
    if (e.key === "Escape" && !slashOpen) {
      textareaRef.current?.blur();
    }
  }

  // Global keyboard shortcuts (focus composer).
  useEffect(() => {
    if (!shortcuts) return;
    function onGlobal(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "k") {
        // Do not hijack browser find in inputs? Focus composer instead.
        e.preventDefault();
        textareaRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onGlobal);
    return () => document.removeEventListener("keydown", onGlobal);
  }, [shortcuts]);

  function onPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const pastedFiles: File[] = [];
    for (const item of Array.from(items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) pastedFiles.push(f);
      }
    }
    if (pastedFiles.length) {
      e.preventDefault();
      fileHandler?.(pastedFiles);
      setFiles?.(pastedFiles);
    }
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  function onDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const dropped = e.dataTransfer?.files;
    if (dropped && dropped.length) handleFiles(dropped);
  }

  const canSend = Boolean(text.trim()) && !disabled && !resolvedStreaming;

  return (
    <div
      className={`relative ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div
          className="absolute inset-0 z-40 flex items-center justify-center rounded-2xl border-2 border-dashed border-blue-400/60 bg-blue-500/10 text-blue-200 text-sm pointer-events-none"
          aria-hidden="true"
        >
          <Paperclip size={16} className="mr-2" /> Drop files to attach
        </div>
      )}

      {/* Attachment chips */}
      {attachmentList.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2" role="list" aria-label="Attachments">
          {attachmentList.map((a) => (
            <span
              key={a.id}
              className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 flex items-center gap-1"
              role="listitem"
            >
              <Paperclip size={10} aria-hidden="true" />
              <span className="max-w-[160px] truncate">{a.fileName}</span>
              {removeAttachment && (
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="hover:text-red-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
                  aria-label={`Remove ${a.fileName}`}
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-white/5 border border-white/10 p-2 focus-within:border-blue-400/40 transition-colors">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            placeholder={placeholder}
            rows={minRows}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-multiline="true"
            aria-describedby="chat-input-help"
            className="w-full resize-none bg-transparent outline-none text-sm px-3 py-2 min-h-[2.5rem] max-h-40 overflow-y-auto scrollbar-thin"
            spellCheck
          />

          {/* Slash command menu */}
          {enableSlashCommands && slashOpen && filteredCommands.length > 0 && (
            <div
              role="listbox"
              aria-label="Slash commands"
              aria-activedescendant={activeCommand ? `slash-${activeCommand.name}` : undefined}
              className="absolute bottom-full left-0 mb-2 w-full max-h-64 overflow-auto rounded-xl border border-white/10 bg-[#0b0f1a]/95 backdrop-blur-lg p-1.5 shadow-2xl shadow-black/40 z-50"
            >
              {filteredCommands.map((cmd, idx) => {
                const active = idx === safeIndex;
                return (
                  <button
                    key={cmd.name}
                    id={`slash-${cmd.name}`}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setSlashIndex(idx)}
                    onClick={() => selectSlashCommand(cmd)}
                    className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                      active ? "bg-blue-500/15 text-blue-100" : "text-slate-200 hover:bg-white/5"
                    }`}
                  >
                    <Command size={13} className="text-slate-400 shrink-0" aria-hidden="true" />
                    <span className="font-mono text-xs text-blue-300 shrink-0">/{cmd.name}</span>
                    <span className="flex-1 text-xs text-slate-300 truncate">{cmd.description}</span>
                    {cmd.usage && <span className="text-[10px] text-slate-500 shrink-0">{cmd.usage}</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept={accept}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
              title="Add files"
              aria-label="Add files"
            >
              + Files
            </button>
            <span id="chat-input-help" className="text-[10px] text-slate-600">
              Enter to send · Shift+Enter newline · / for commands · Ctrl+K focus
            </span>
          </div>
          <div className="flex items-center gap-2">
            {resolvedStreaming ? (
              <button
                type="button"
                onClick={() => onStop?.()}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
                title="Stop"
                aria-label="Stop generating"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => submitText()}
                disabled={!canSend}
                className="px-4 py-1.5 rounded-lg bg-white text-black disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 flex items-center gap-1.5"
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Live region for slash command announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {slashOpen && activeCommand ? `Slash command ${activeCommand.name}: ${activeCommand.description}` : ""}
      </div>
    </div>
  );
});

export { ChatInput };
export default ChatInput;