import Nav from "@/components/Nav";
export default function PrivacyPage() {
  return (
    <main><Nav />
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-4 text-slate-300">
        <h1 className="text-3xl font-semibold text-white">Privacy Policy</h1>
        <p>HORIZON processes account, usage, and subscription data to provide AI services. Personal data is stored in PostgreSQL and protected with hashed passwords, secure sessions, and server-side authorization.</p>
        <p>Usage and token accounting are server authoritative. Payment data is processed by Stripe. Bitcoin conversion records are stored for audit purposes.</p>
      </div>
    </main>
  );
}