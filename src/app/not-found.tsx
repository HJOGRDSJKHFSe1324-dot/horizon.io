import Nav from "@/components/Nav";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <main id="main" className="min-h-screen">
      <Nav />
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-[0.75rem] uppercase tracking-[0.3em] text-[var(--muted)]">404</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-4 text-[var(--muted)] max-w-xl mx-auto leading-relaxed">
          The page you are looking for does not exist or has moved.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--fg)] text-[var(--bg)] font-medium hover:opacity-90">
            <ArrowLeft size={16} /> Back home
          </Link>
        </div>
      </section>
    </main>
  );
}
