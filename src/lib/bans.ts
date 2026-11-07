import { promises as fs } from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "storage", "bans");
const FILE = path.join(ROOT, "banned_ips.json");
const DURATION_HOURS = Number(process.env.BAN_DURATION_HOURS || 24);

export type BanEntry = {
  ip: string;
  email: string | null;
  banned: boolean;
  bannedAt: string | null;
  expiresAt: string | null;
  location: any;
  reason: string | null;
  attempts: number;
  lastSeen: string;
};

async function ensureDir() {
  await fs.mkdir(ROOT, { recursive: true });
}

export async function loadBans(): Promise<BanEntry[]> {
  await ensureDir();
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
    return [];
  }
}

async function saveBans(list: BanEntry[]) {
  await ensureDir();
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
}

export function isCurrentlyBanned(entry: BanEntry | undefined): boolean {
  if (!entry || !entry.banned) return false;
  if (!entry.expiresAt) return true;
  return new Date(entry.expiresAt).getTime() > Date.now();
}

export async function getLocation(ip: string): Promise<any> {
  if (ip === "unknown" || ip.startsWith("127.") || ip.startsWith("192.168.") || ip.startsWith("10.") || ip === "::1") {
    return { country: "Local", region: "Local", city: "Local/private network", latitude: null, longitude: null };
  }
  try {
    const r = await fetch(`http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,regionName,city,lat,lon,timezone,isp`, { signal: AbortSignal.timeout(4000) });
    const data: any = await r.json();
    if (data?.status !== "success") return null;
    return { country: data.country, region: data.regionName, city: data.city, latitude: data.lat, longitude: data.lon, timezone: data.timezone, isp: data.isp };
  } catch {
    return null;
  }
}

export async function recordBan(ip: string, email: string | null, reason: string): Promise<BanEntry> {
  const list = await loadBans();
  const now = new Date();
  const expiry = new Date(now.getTime() + DURATION_HOURS * 60 * 60 * 1000);
  const location = await getLocation(ip);
  const existing = list.find((e) => e.ip === ip);
  if (existing) {
    existing.banned = true;
    existing.email = email || existing.email;
    existing.reason = reason;
    existing.attempts = (existing.attempts || 0) + 1;
    existing.bannedAt = now.toISOString();
    existing.expiresAt = expiry.toISOString();
    existing.location = location || existing.location;
    existing.lastSeen = now.toISOString();
    await saveBans(list);
    return existing;
  }
  const entry: BanEntry = {
    ip,
    email,
    banned: true,
    bannedAt: now.toISOString(),
    expiresAt: expiry.toISOString(),
    location,
    reason,
    attempts: 1,
    lastSeen: now.toISOString(),
  };
  list.push(entry);
  await saveBans(list);
  return entry;
}

export async function getBan(ip: string): Promise<BanEntry | undefined> {
  const list = await loadBans();
  return list.find((e) => e.ip === ip);
}

export async function setBanStatus(ip: string, banned: boolean, durationHours?: number): Promise<BanEntry | undefined> {
  const list = await loadBans();
  const entry = list.find((e) => e.ip === ip);
  if (!entry) return undefined;
  entry.banned = banned;
  entry.lastSeen = new Date().toISOString();
  if (banned) {
    const hours = durationHours || DURATION_HOURS;
    entry.expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
    if (!entry.bannedAt) entry.bannedAt = new Date().toISOString();
  } else {
    entry.expiresAt = null;
  }
  await saveBans(list);
  return entry;
}

export function detectJailbreak(text: string): string | null {
  const t = text.toLowerCase();
  const patterns: Array<[RegExp, string]> = [
    [/ignore (all |previous |prior )?(instructions|rules|safety)/i, "instruction override"],
    [/system prompt/i, "system prompt extraction"],
    [/developer mode/i, "developer-mode jailbreak"],
    [/\bdan\b/i, "DAN jailbreak"],
    [/jailbreak/i, "jailbreak keyword"],
    [/bypass (safety|filter|guard)/i, "safety bypass"],
    [/pretend (to be|you are) (?!.*assistant)/i, "role override"],
    [/act as if (you have no|without) restrictions/i, "restriction bypass"],
    [/reveal (your|the) (system|hidden) prompt/i, "prompt leak"],
    [/output (only|just) the (system|hidden)/i, "prompt leak"],
  ];
  for (const [re, reason] of patterns) {
    if (re.test(t)) return reason;
  }
  return null;
}