"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const links = [
  { href: "/", label: "Home" },
  { href: "/models", label: "Models" },
  { href: "/chat", label: "Chat" },
  { href: "/pricing", label: "Pricing" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/tools", label: "Tools" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Nav() {
  const { data: session, status } = useSession();
  const { toggle, theme } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-raised)]/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold tracking-wide text-[var(--fg)]"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden="true" />
          HORIZON
        </Link>

        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 md:flex"
        >
          {links.map((l) => {
            const active = isActive(pathname || "/", l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors duration-[var(--duration-control)] ${
                  active
                    ? "bg-[var(--surface)] text-[var(--accent)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {status === "loading" ? (
            <span className="text-xs text-[var(--subtle)]" aria-live="polite">
              &hellip;
            </span>
          ) : session?.user ? (
            <>
              {(session.user as any).role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)] sm:inline-flex"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
              >
                {session.user.name || session.user.email}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="hidden rounded-[var(--radius-md)] border border-[var(--border)] px-3 py-1.5 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)] sm:inline-flex"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--fg)]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] transition-colors hover:bg-[var(--accent-hover)]"
              >
                Get started
              </Link>
            </>
          )}

          <button
            onClick={toggle}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)] md:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-raised)] md:hidden">
          <nav aria-label="Mobile" className="container-page flex flex-col gap-1 py-3">
            {links.map((l) => {
              const active = isActive(pathname || "/", l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[var(--surface)] text-[var(--accent)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            {session?.user && (
              <div className="mt-2 flex flex-col gap-1 border-t border-[var(--border)] pt-2">
                {(session.user as any).role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                  >
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-[var(--radius-md)] px-3 py-2 text-left text-sm font-medium text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                >
                  Sign out
                </button>
              </div>
            )}
            {!session?.user && (
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-3 py-2 text-center text-sm font-medium text-[var(--accent-fg)] hover:bg-[var(--accent-hover)]"
              >
                Get started
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}