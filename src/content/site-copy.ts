// Central copy strings for the HORIZON website.
// Keep copy here so page components stay thin and voice stays consistent.
// Voice: plain, direct, concrete. No hype words.

export const siteCopy = {
  brand: {
    name: "HORIZON",
    shortName: "Horizon",
  },
  nav: {
    getStarted: "Create account",
    signIn: "Sign in",
    signOut: "Sign out",
  },
  home: {
    eyebrow: "HORIZON",
    heroTitle: "AI you can run yourself.",
    heroLead:
      "Pick a model, ask a question, and keep the thread. HORIZON serves its own models from servers we run, with token counts and pricing you can see.",
    primaryCta: "Create account",
    secondaryCta: "See the models",
    composerPlaceholder: "Message HORIZON...",
    composerHint: "Enter to send. Shift+Enter for a new line.",
    sendButton: "Go",
    modelsTitle: "Models for different jobs.",
    modelsSubtitle: "Choose the one that fits what you are doing.",
    modelsViewAll: "View all",
    ctaTitle: "Your own inference, billed by the token.",
    ctaBody:
      "Requests route to our inference server through a tunnel we control. Billing, token accounting, cooldowns, bans, and benchmarks are checked on the server, not in the browser.",
    ctaPlans: "View plans",
    ctaBenchmarks: "See benchmarks",
    modelChatAction: "Start chatting",
    modelChips: {
      free: "Free",
      max: "Max",
    },
    modelTags: {
      freeModel: "FREE MODEL",
      flagship: "FLAGSHIP",
    },
    models: [
      {
        name: "Zenith-1.1",
        slug: "zenith-1.1",
        tag: "FREE MODEL",
        desc: "Fast baseline for everyday chat, summaries, and light reasoning.",
        chip: "Free",
      },
      {
        name: "Nova 5.4 Ultra",
        slug: "nova-5.4-ultra",
        tag: "FLAGSHIP",
        desc: "Our deepest model for long-form analysis and generation.",
        chip: "Max",
      },
    ],
  },
  modelsPage: {
    title: "Models",
    freeNote: "Zenith-1.1 is free forever. Nova models are paid and require Pro at minimum.",
    plansLabel: "Plan",
    plansLabelPlural: "Plans",
    available: "Available",
    chatAction: "Chat",
    lockedHint: "Locked",
  },
  pricing: {
    title: "Pricing",
    subtitle: "Choose a plan.",
    subscribe: "Subscribe",
    freeTier: "Free",
    working: "Working...",
    missingStripe: "Configure Stripe to enable payments.",
    priceSuffix: "/mo",
    planMeta: {
      FREE: { desc: "Get started", features: ["200K tokens", "Zenith-1.1", "5-hour cooldown on the free model"] },
      PLUS: { desc: "Everyday use", features: ["500K tokens per cycle", "Zenith-1.1", "Standard priority"] },
      PRO: { desc: "All models, sensible price", features: ["1M tokens per cycle", "All models", "Standard priority"], highlight: "Popular" },
      ULTRA: { desc: "Maximum tokens", features: ["5M tokens per cycle", "All models", "Highest priority"], highlight: "Premium" },
    },
  },
  benchmarks: {
    title: "HORIZON Benchmarks",
    subtitle: "Measured results from running the same tests against each model.",
    noResults: "No published benchmark results yet.",
    mmluTitle: "MMLU-Pro sample results",
    mmluAlt: "MMLU-Pro benchmark scores by model",
    table: {
      model: "Model",
      test: "Test",
      category: "Category",
      tokensPerSecond: "Tokens/sec",
      latencyMs: "Latency (ms)",
      overall: "Overall",
      measuredManual: "Measured/Manual",
      measured: "Measured",
      manual: "Manual",
    },
    labels: {
      tokensPerSecond: "Tokens/sec",
      averageLatency: "Avg latency",
      reasoning: "Reasoning",
      coding: "Coding",
      math: "Math",
      knowledge: "Knowledge",
      overall: "Overall",
    },
  },
  chat: {
    emptyTitle: "Start a conversation.",
    emptyBody: "Pick a model above and ask anything. You can also try one of these.",
    composerPlaceholder: "Message HORIZON...",
    newChat: "New chat",
    newConversationTitle: "New conversation",
    deleteConfirm: "Delete this conversation?",
    renameConfirm: "Save name",
    suggestedPrompts: [
      "Summarise this conversation so far.",
      "Write a short Python script to clean a CSV file.",
      "Explain how token billing works here in plain terms.",
      "Compare Zenith-1.1, Nova 5.2, and Nova 5.4 Ultra for my use case.",
    ],
    emptyStatePromptHint: "Click a prompt to load it into the composer.",
    loading: "Loading...",
    unavailable: "Unavailable",
    tokensLeft: "Tokens left",
    cooldown: "Cooldown",
    attachments: {
      addFiles: "+ Files",
      uploadFailed: "Upload failed",
    },
    effortLabels: {
      low: "Low (0.5x)",
      medium: "Medium (recommended)",
      high: "High (2x)",
      xhigh: "X-High (3x)",
      max: "Max (6x usage)",
    },
    errors: {
      requestFailed: "Request failed",
    },
  },
  footer: {
    copyright: "HORIZON",
  },
} as const;

export type SiteCopy = typeof siteCopy;