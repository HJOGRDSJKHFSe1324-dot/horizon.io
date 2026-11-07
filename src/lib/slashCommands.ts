/**
 * Slash command definitions and helpers for the HORIZON chat composer.
 *
 * A slash command is typed at the start of the composer input, e.g. `/help`.
 * Commands may either insert text into the composer or trigger an action.
 */

export type SlashCommandAction =
  | "insert"
  | "submit"
  | "clear"
  | "new"
  | "focus-model"
  | "toggle-search"
  | "toggle-think"
  | "set-effort"
  | "help";

export type SlashCommand = {
  /** Command name without the leading slash, e.g. "help". */
  name: string;
  /** Short alias, e.g. "h". */
  aliases?: string[];
  /** One-line description shown in the command menu. */
  description: string;
  /** Usage hint, e.g. "/effort high". */
  usage?: string;
  /** What happens when the command is selected. */
  action: SlashCommandAction;
  /** Optional payload inserted or applied. */
  payload?: string;
  /** Lucide icon name for affordance (optional, presentational only). */
  icon?: string;
  /** Whether the command needs extra arguments. */
  requiresArgs?: boolean;
};

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    name: "help",
    aliases: ["h", "?"],
    description: "List available slash commands.",
    usage: "/help",
    action: "help",
  },
  {
    name: "clear",
    aliases: ["reset"],
    description: "Clear the current composer text.",
    usage: "/clear",
    action: "clear",
  },
  {
    name: "new",
    aliases: ["newchat"],
    description: "Start a new conversation.",
    usage: "/new",
    action: "new",
  },
  {
    name: "search",
    aliases: ["web"],
    description: "Toggle web search for the next reply.",
    usage: "/search",
    action: "toggle-search",
  },
  {
    name: "think",
    aliases: ["hard"],
    description: "Toggle 'think harder' mode.",
    usage: "/think",
    action: "toggle-think",
  },
  {
    name: "effort",
    description: "Set reasoning effort: low, medium, high, xhigh, max.",
    usage: "/effort high",
    action: "set-effort",
    requiresArgs: true,
    payload: "medium",
  },
  {
    name: "model",
    aliases: ["m"],
    description: "Open the model selector.",
    usage: "/model",
    action: "focus-model",
  },
  {
    name: "attach",
    aliases: ["file", "upload"],
    description: "Attach files to this message.",
    usage: "/attach",
    action: "insert",
    payload: "",
  },
  {
    name: "code",
    description: "Wrap the following text in a fenced code block.",
    usage: "/code <language>",
    action: "submit",
    payload: "```\n\n```",
    requiresArgs: true,
  },
  {
    name: "summarize",
    aliases: ["sum"],
    description: "Ask the model to summarize the conversation.",
    usage: "/summarize",
    action: "submit",
    payload: "Summarize this conversation so far.",
  },
];

const EFFORT_VALUES = new Set(["low", "medium", "high", "xhigh", "max"]);

export type ParsedSlashCommand = {
  raw: string;
  name: string;
  args: string;
  command: SlashCommand | null;
  isValid: boolean;
};

/** Parse a composer string that begins with `/`. */
export function parseSlashCommand(input: string): ParsedSlashCommand {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return { raw: trimmed, name: "", args: "", command: null, isValid: false };
  }
  const withoutSlash = trimmed.slice(1);
  const spaceIndex = withoutSlash.search(/\s/);
  const name = (spaceIndex === -1 ? withoutSlash : withoutSlash.slice(0, spaceIndex)).toLowerCase();
  const args = spaceIndex === -1 ? "" : withoutSlash.slice(spaceIndex + 1).trim();
  const command = findSlashCommand(name) ?? null;
  let isValid = command !== null;
  if (command?.requiresArgs && command.action === "set-effort") {
    isValid = EFFORT_VALUES.has(args.toLowerCase());
  }
  return { raw: trimmed, name, args, command, isValid };
}

/** Find a command by name or alias. */
export function findSlashCommand(name: string): SlashCommand | undefined {
  const key = name.toLowerCase().replace(/^\//, "");
  return SLASH_COMMANDS.find(
    (c) => c.name === key || (c.aliases ?? []).includes(key),
  );
}

/** Filter commands by a partial query (text after the slash, no spaces). */
export function filterSlashCommands(query: string): SlashCommand[] {
  const q = query.toLowerCase().replace(/^\//, "").split(/\s/)[0];
  if (q === "") return [...SLASH_COMMANDS];
  return SLASH_COMMANDS.filter((c) => {
    const names = [c.name, ...(c.aliases ?? [])];
    return names.some((n) => n.startsWith(q)) || c.description.toLowerCase().includes(q);
  });
}

/** Whether the current input should open the slash command menu. */
export function isSlashCommandMode(input: string): boolean {
  const v = input.trimStart();
  if (!v.startsWith("/")) return false;
  // Only show the menu while the user is still typing the command name.
  const afterSlash = v.slice(1);
  return !afterSlash.includes(" ") || afterSlash.split(" ")[0].length < 24;
}

/** Apply a selected slash command to the current input string. */
export function applySlashCommand(input: string, command: SlashCommand): string {
  if (command.action === "insert" || command.action === "submit") {
    if (command.payload) return command.payload;
    // Keep the command text for commands that need arguments.
    if (command.requiresArgs) return `/${command.name} `;
  }
  // For action commands, clear the slash token.
  return "";
}

export const SLASH_COMMAND_SHORTCUT = "/" as const;