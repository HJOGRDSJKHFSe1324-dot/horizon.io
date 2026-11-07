import Link from "next/link";

const year = new Date().getFullYear();

const productLinks = [
  { href: "/models", label: "Models" },
  { href: "/chat", label: "Chat" },
  { href: "/pricing", label: "Pricing" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/tools", label: "Tools" },
];

const accountLinks = [
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create account" },
  { href: "/dashboard", label: "Dashboard" },
];

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--subtle)]">{title}</h3>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-sm text-[var(--muted)] transition-colors duration-[var(--duration-control)] hover:text-[var(--fg)]"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-[var(--space-20)] border-t border-[var(--border)] bg-[var(--bg-raised)]">
      <div className="container-page py-[var(--space-16)]">
        <div className="grid gap-[var(--space-8)] sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-display text-lg font-semibold tracking-wide text-[var(--fg)]"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
              HORIZON
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-[var(--muted)]">
              Independent AI models. Chat, subscribe, benchmark.
            </p>
            <p className="text-xs text-[var(--subtle)]">&copy; {year} HORIZON. All rights reserved.</p>
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Account" links={accountLinks} />
          <FooterColumn title="Legal" links={legalLinks} />
        </div>
      </div>
    </footer>
  );
}