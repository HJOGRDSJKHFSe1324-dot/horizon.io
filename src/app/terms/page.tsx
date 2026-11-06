import Nav from "@/components/Nav";
export default function TermsPage() {
  return (
    <main><Nav />
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-4 text-slate-300">
        <h1 className="text-3xl font-semibold text-white">Terms of Service</h1>
        <p>HORIZON provides access to independently hosted AI models. Free allowances, subscriptions, and usage limits are enforced server-side. Do not attempt to bypass token limits, manipulate requests, or abuse the service.</p>
        <p>Paid subscriptions renew according to their billing cycle and can be canceled at any time, with access continuing until the period end.</p>
      </div>
    </main>
  );
}