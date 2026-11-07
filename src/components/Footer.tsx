import Link from "next/link";

const links = [
  { href: "/models", label: "Models" },
  { href: "/chat", label: "Chat" },
  { href: "/pricing", label: "Pricing" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/tools", label: "Tools" },
];

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10 text-sm text-[var(--muted)] flex flex-col md:flex-row justify-between gap-4">
        <div>© {new Date().getFullYear()} HORIZON</div>
        <div className="flex flex-wrap gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-[var(--fg)] transition">{l.label}</Link>
          ))}
          <Link href="/privacy" className="hover:text-[var(--fg)] transition">Privacy</Link>
          <Link href="/terms" className="hover:text-[var(--fg)] transition">Terms</Link>
        </div>
      </div>
    </footer>
  );
}