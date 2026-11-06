import Nav from "@/components/Nav";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const models = [
  { name: "Zenith-1.1", tag: "FREE MODEL", desc: "Fast and capable. Available to all registered users.", badge: "Free" },
  { name: "Halo 1.5", tag: "PAID MODEL", desc: "Advanced reasoning and coding for subscribers.", badge: "Pro" },
  { name: "Halo 2.5", tag: "PREMIUM MODEL", desc: "Our most powerful model.", badge: "Ultra" },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      <Nav />
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="max-w-3xl animate-fade">
          <p className="text-xs tracking-[0.3em] text-slate-400 mb-6">HORIZON PLATFORM</p>
          <h1 className="text-6xl md:text-7xl font-semibold leading-[1.05] tracking-tight">
            Intelligence <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-500">Beyond Limits.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 max-w-xl">
            HORIZON gives you access to independently developed AI models, hosted on our own infrastructure. Register, chat, and scale.
          </p>
          <div className="mt-10 flex gap-4">
            <Link href="/register" className="px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-slate-200 flex items-center gap-2">
              Get Started <ArrowRight size={16} />
            </Link>
            <Link href="/models" className="px-6 py-3 rounded-full border border-white/15 hover:bg-white/5">
              Explore Models
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-semibold mb-10">Models</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {models.map(m => (
            <div key={m.name} className="glass rounded-2xl p-6 hover:border-white/10 transition">
              <div className="text-xs text-slate-400 tracking-widest">{m.tag}</div>
              <h3 className="text-2xl mt-2 font-semibold">{m.name}</h3>
              <p className="mt-3 text-slate-400 text-sm">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="glass rounded-3xl p-10 text-center">
          <h2 className="text-3xl font-semibold">Run independently. Scale effortlessly.</h2>
          <p className="text-slate-400 mt-4 max-w-2xl mx-auto">
            HORIZON runs its AI infrastructure independently, routing secure requests to our dedicated inference server. No third-party model providers.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/pricing" className="px-6 py-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium">View Plans</Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-10 text-sm text-slate-500 flex flex-col md:flex-row justify-between gap-4">
          <div>© {new Date().getFullYear()} HORIZON</div>
          <div className="flex gap-6">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/benchmarks">Benchmarks</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}