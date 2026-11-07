"use client";
import Nav from "@/components/Nav";
import { useEffect, useState } from "react";

const tabs = ["Overview", "Users", "Subscriptions", "Payments", "Conversions", "Withdrawals", "Bans", "Models", "Server", "Benchmarks", "Settings"];

export default function AdminPage() {
  const [tab, setTab] = useState("Overview");
  const [data, setData] = useState<Record<string, any>>({});
  const [msg, setMsg] = useState("");

  async function load(key: string, url: string) {
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      setData(prev => ({ ...prev, [key]: j }));
    }
  }

  useEffect(() => {
    load("stats", "/api/admin/stats");
    load("users", "/api/admin/users");
    load("subs", "/api/admin/subscriptions");
    load("payments", "/api/admin/payments");
    load("conversions", "/api/admin/conversions");
    load("withdrawals", "/api/admin/withdrawals");
    load("bans", "/api/admin/bans");
    load("bans", "/api/admin/bans");
    load("models", "/api/models?admin=1");
    load("health", "/api/admin/server-health");
    load("benchmarks", "/api/admin/benchmarks");
    load("settings", "/api/admin/settings");
    load("plans", "/api/plans");
  }, []);

  const refresh = () => {
    load("stats", "/api/admin/stats");
    load("users", "/api/admin/users");
    load("models", "/api/models?admin=1");
    load("health", "/api/admin/server-health");
    load("benchmarks", "/api/admin/benchmarks");
    load("conversions", "/api/admin/conversions");
    load("withdrawals", "/api/admin/withdrawals");
    load("bans", "/api/admin/bans");
    load("bans", "/api/admin/bans");
  };

  return (
    <main id="main"><Nav />
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-semibold mb-6">Admin Dashboard</h1>
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-1.5 rounded-full text-sm ${tab === t ? "bg-white text-black" : "bg-white/5 hover:bg-white/10"}`}>{t}</button>
          ))}
        </div>
        {msg && <div className="text-sm text-green-400 mb-4">{msg}</div>}

        {tab === "Overview" && <Overview data={data.stats} />}
        {tab === "Users" && <UsersTab data={data.users} refresh={refresh} setMsg={setMsg} />}
        {tab === "Subscriptions" && <SubsTab data={data.subs} />}
        {tab === "Payments" && <PaymentsTab data={data.payments} />}
        {tab === "Conversions" && <ConversionsTab data={data.conversions} refresh={refresh} setMsg={setMsg} />}
        {tab === "Withdrawals" && <WithdrawalsTab data={data.withdrawals} btcAddress={(data.settings || []).find((s: any) => s.key === "btc_receiving_address")?.value} refresh={refresh} setMsg={setMsg} />}
        {tab === "Bans" && <BansTab data={data.bans} refresh={refresh} setMsg={setMsg} />}
        {tab === "Models" && <ModelsTab data={data.models?.models} refresh={refresh} setMsg={setMsg} />}
        {tab === "Server" && <ServerTab data={data.health} refresh={refresh} setMsg={setMsg} />}
        {tab === "Benchmarks" && <BenchmarksTab data={data.benchmarks} models={data.models?.models} refresh={refresh} setMsg={setMsg} />}
        {tab === "Settings" && <SettingsTab data={data.settings} refresh={refresh} setMsg={setMsg} />}
      </div>
    </main>
  );
}

function Overview({ data }: any) {
  if (!data) return <div>Loading...</div>;
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <Stat label="Users" value={data.users} />
      <Stat label="Paid users" value={data.paidUsers} />
      <Stat label="Free users" value={data.freeUsers} />
      <Stat label="Revenue" value={`£${data.totalRevenueGbp}`} />
      <Stat label="Payments" value={data.paymentsCount} />
      <Stat label="Subscriptions" value={data.subscriptions} />
      <Stat label="Conversions" value={data.conversionsCount} />
      <Stat label="BTC sent" value={data.totalBtcSent} />
    </div>
  );
}
function Stat({ label, value }: any) { return <div className="glass rounded-xl p-4"><div className="text-slate-400 text-xs">{label}</div><div className="text-2xl font-bold mt-1">{value ?? "—"}</div></div>; }

function UsersTab({ data, refresh, setMsg }: any) {
  const [q, setQ] = useState("");
  async function act(userId: string, action: string, value?: any) {
    const res = await fetch("/api/admin/users", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, action, value }) });
    const d = await res.json();
    setMsg(res.ok ? "Done" : (d.error || "Failed"));
    refresh();
  }
  const filtered = (data || []).filter((u: any) => !q || (u.email + (u.name||"")).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search users" className="mb-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
      <div className="overflow-x-auto glass rounded-xl">
        <table className="w-full text-xs">
          <thead className="text-slate-400 border-b border-white/5"><tr>
            <th className="p-2 text-left">Email</th><th className="p-2">Role</th><th className="p-2">Plan</th><th className="p-2">Tokens</th><th className="p-2">Joined</th><th className="p-2">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map((u: any) => (
              <tr key={u.id} className="border-b border-white/5">
                <td className="p-2">{u.email}</td>
                <td className="p-2 text-center">{u.role}</td>
                <td className="p-2 text-center">{u.subscription?.plan?.slug || "FREE"}</td>
                <td className="p-2 text-center">{u.tokenBalance}</td>
                <td className="p-2 text-center">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="p-2 text-center space-x-1">
                  <button onClick={() => act(u.id, "role", u.role === "ADMIN" ? "USER" : "ADMIN")} className="px-2 py-0.5 rounded bg-white/10">{u.role === "ADMIN" ? "Demote" : "Promote"}</button>
                  <button onClick={() => act(u.id, "grantTokens", 100000)} className="px-2 py-0.5 rounded bg-white/10">+100k</button>
                  <button onClick={() => act(u.id, "resetFree")} className="px-2 py-0.5 rounded bg-white/10">Reset free</button>
                  <button onClick={() => act(u.id, "delete")} className="px-2 py-0.5 rounded bg-red-500/20 text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SubsTab({ data }: any) {
  return (
    <div className="overflow-x-auto glass rounded-xl">
      <table className="w-full text-xs">
        <thead className="text-slate-400 border-b border-white/5"><tr>
          <th className="p-2 text-left">User</th><th className="p-2">Plan</th><th className="p-2">Status</th><th className="p-2">Period end</th><th className="p-2">Stripe sub</th>
        </tr></thead>
        <tbody>
          {(data || []).map((s: any) => (
            <tr key={s.id} className="border-b border-white/5">
              <td className="p-2">{s.user?.email}</td>
              <td className="p-2 text-center">{s.plan?.name}</td>
              <td className="p-2 text-center">{s.status}</td>
              <td className="p-2 text-center">{s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}</td>
              <td className="p-2 text-center">{s.stripeSubscriptionId || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsTab({ data }: any) {
  return (
    <div className="overflow-x-auto glass rounded-xl">
      <table className="w-full text-xs">
        <thead className="text-slate-400 border-b border-white/5"><tr>
          <th className="p-2 text-left">User</th><th className="p-2">Plan</th><th className="p-2">Amount</th><th className="p-2">Status</th><th className="p-2">Date</th>
        </tr></thead>
        <tbody>
          {(data || []).map((p: any) => (
            <tr key={p.id} className="border-b border-white/5">
              <td className="p-2">{p.user?.email}</td>
              <td className="p-2 text-center">{p.plan?.name}</td>
              <td className="p-2 text-center">£{(p.amountGbp/100).toFixed(2)}</td>
              <td className="p-2 text-center">{p.status}</td>
              <td className="p-2 text-center">{new Date(p.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConversionsTab({ data, refresh, setMsg }: any) {
  async function update(c: any, patch: any) {
    const res = await fetch("/api/admin/conversions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, ...patch }) });
    setMsg(res.ok ? "Updated" : "Failed");
    refresh();
  }
  return (
    <div className="overflow-x-auto glass rounded-xl">
      <table className="w-full text-xs">
        <thead className="text-slate-400 border-b border-white/5"><tr>
          <th className="p-2 text-left">Created</th><th className="p-2">GBP</th><th className="p-2">BTC</th><th className="p-2">Address</th><th className="p-2">Status</th><th className="p-2">Txid</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {(data || []).map((c: any) => (
            <tr key={c.id} className="border-b border-white/5">
              <td className="p-2">{new Date(c.createdAt).toLocaleDateString()}</td>
              <td className="p-2 text-center">£{(c.gbpAmount/100).toFixed(2)}</td>
              <td className="p-2 text-center">{c.btcAmount ? String(c.btcAmount) : "—"}</td>
              <td className="p-2 text-center font-mono text-[10px]">{c.targetAddress}</td>
              <td className="p-2 text-center">{c.status}</td>
              <td className="p-2 text-center font-mono text-[10px]">{c.txid || "—"}</td>
              <td className="p-2 text-center space-x-1">
                <button onClick={() => { const t = prompt("Txid"); if (t) update(c, { status: "SUCCEEDED", txid: t }); }} className="px-2 py-0.5 rounded bg-white/10">Mark sent</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WithdrawalsTab({ data, btcAddress, refresh, setMsg }: any) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  async function create() {
    const res = await fetch("/api/admin/withdrawals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ btcAmount: amount, address: btcAddress, notes }) });
    setMsg(res.ok ? "Requested" : "Failed");
    setAmount(""); setNotes("");
    refresh();
  }
  async function update(w: any, patch: any) {
    const res = await fetch("/api/admin/withdrawals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: w.id, ...patch }) });
    setMsg(res.ok ? "Updated" : "Failed");
    refresh();
  }
  return (
    <div>
      <div className="glass rounded-xl p-4 mb-4 space-y-2">
        <div className="text-sm text-slate-400">Manual BTC withdrawal (admin-controlled). Receiving address: <span className="font-mono">{btcAddress}</span></div>
        <div className="flex gap-2">
          <input value={amount} onChange={e=>setAmount(e.target.value)} placeholder="BTC amount" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
          <input value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Notes" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm flex-1" />
          <button onClick={create} className="px-4 py-2 rounded-lg bg-white text-black text-sm">Request</button>
        </div>
      </div>
      <div className="overflow-x-auto glass rounded-xl">
        <table className="w-full text-xs">
          <thead className="text-slate-400 border-b border-white/5"><tr>
            <th className="p-2">Amount</th><th className="p-2">Address</th><th className="p-2">Status</th><th className="p-2">Txid</th><th className="p-2">Actions</th>
          </tr></thead>
          <tbody>
            {(data || []).map((w: any) => (
              <tr key={w.id} className="border-b border-white/5">
                <td className="p-2 text-center">{String(w.btcAmount)}</td>
                <td className="p-2 text-center font-mono text-[10px]">{w.address}</td>
                <td className="p-2 text-center">{w.status}</td>
                <td className="p-2 text-center font-mono text-[10px]">{w.txid || "—"}</td>
                <td className="p-2 text-center space-x-1">
                  <button onClick={() => { const t = prompt("Txid"); if (t) update(w, { status: "SENT", txid: t }); }} className="px-2 py-0.5 rounded bg-white/10">Mark sent</button>
                  <button onClick={() => update(w, { status: "CONFIRMED" })} className="px-2 py-0.5 rounded bg-white/10">Confirm</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelsTab({ data, refresh, setMsg }: any) {
  const [editing, setEditing] = useState<any>(null);
  async function save() {
    const res = await fetch("/api/models", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) });
    setMsg(res.ok ? "Saved" : "Failed");
    setEditing(null); refresh();
  }
  return (
    <div>
      <div className="overflow-x-auto glass rounded-xl mb-4">
        <table className="w-full text-xs">
          <thead className="text-slate-400 border-b border-white/5"><tr>
            <th className="p-2 text-left">Name</th><th className="p-2">Slug</th><th className="p-2">Tier</th><th className="p-2">Min plan</th><th className="p-2">Enabled</th><th className="p-2">Actions</th>
          </tr></thead>
          <tbody>
            {(data || []).map((m: any) => (
              <tr key={m.id} className="border-b border-white/5">
                <td className="p-2">{m.name}</td>
                <td className="p-2 text-center">{m.slug}</td>
                <td className="p-2 text-center">{m.tier}</td>
                <td className="p-2 text-center">{m.minPlan}</td>
                <td className="p-2 text-center">{m.enabled ? "Yes" : "No"}</td>
                <td className="p-2 text-center space-x-1">
                  <a href={`/chat?model=${m.slug}`} target="_blank" rel="noopener noreferrer" className="px-2 py-0.5 rounded bg-white/10">Preview</a>
                  <button onClick={() => setEditing({ ...m })} className="px-2 py-0.5 rounded bg-white/10">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <div className="glass rounded-xl p-4 space-y-2">
          <div className="text-sm font-semibold">Edit {editing.name}</div>
          <input value={editing.name} onChange={e=>setEditing({...editing,name:e.target.value})} placeholder="Name" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
          <textarea value={editing.description} onChange={e=>setEditing({...editing,description:e.target.value})} placeholder="Description" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
          <input value={editing.badge || ""} onChange={e=>setEditing({...editing,badge:e.target.value})} placeholder="Badge" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
          <input value={editing.minPlan} onChange={e=>setEditing({...editing,minPlan:e.target.value})} placeholder="Min plan" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
          <input value={editing.apiBaseUrl || ""} onChange={e=>setEditing({...editing,apiBaseUrl:e.target.value})} placeholder="API base URL (server side)" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
          <input value={editing.apiModelId || ""} onChange={e=>setEditing({...editing,apiModelId:e.target.value})} placeholder="API model id" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.enabled} onChange={e=>setEditing({...editing,enabled:e.target.checked})} /> Enabled</label>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-white text-black text-sm">Save</button>
        </div>
      )}
    </div>
  );
}

function ServerTab({ data, refresh, setMsg }: any) {
  async function check() {
    const res = await fetch("/api/admin/server-health", { method: "POST" });
    setMsg(res.ok ? "Health checked" : "Failed");
    refresh();
  }
  return (
    <div>
      <button onClick={check} className="mb-4 px-4 py-2 rounded-lg bg-white text-black text-sm">Run health check</button>
      {!data && <div>Loading...</div>}
      {data && (
        <div className="glass rounded-xl p-4 space-y-2 text-sm">
          <div>Status: <span className={data.status === "online" ? "text-green-400" : "text-red-400"}>{data.status}</span></div>
          <div>Latency: {data.latencyMs} ms</div>
          <div>CPU: {data.cpuPercent ?? "n/a"}% | GPU: {data.gpuPercent ?? "n/a"}%</div>
          <div>Last check: {new Date(data.createdAt).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

function BenchmarksTab({ data, models, refresh, setMsg }: any) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const tests = data?.tests || [];
  const results = data?.results || [];

  useEffect(() => {
    if (models?.length && selectedModels.length === 0) setSelectedModels(models.map((m: any) => m.id));
    if (tests.length && selectedTests.length === 0) setSelectedTests(tests.map((t: any) => t.id));
  }, [models, tests]);

  async function run() {
    const res = await fetch("/api/admin/benchmarks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ modelIds: selectedModels, testIds: selectedTests }) });
    setMsg(res.ok ? "Benchmark run completed" : "Failed");
    refresh();
  }
  async function togglePublish(r: any) {
    await fetch("/api/admin/benchmarks", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, published: !r.published }) });
    refresh();
  }
  function toggle(arr: string[], set: any, id: string) {
    set(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  }

  return (
    <div>
      <div className="mb-4 space-y-2">
        <div className="text-sm text-slate-400">Models:</div>
        <div className="flex flex-wrap gap-2">{(models || []).map((m: any) => (
          <button key={m.id} onClick={() => toggle(selectedModels, setSelectedModels, m.id)}
            className={`px-3 py-1 rounded-full text-xs ${selectedModels.includes(m.id) ? "bg-white text-black" : "bg-white/10"}`}>{m.name}</button>
        ))}</div>
        <div className="text-sm text-slate-400 mt-2">Tests:</div>
        <div className="flex flex-wrap gap-2">{tests.map((t: any) => (
          <button key={t.id} onClick={() => toggle(selectedTests, setSelectedTests, t.id)}
            className={`px-3 py-1 rounded-full text-xs ${selectedTests.includes(t.id) ? "bg-white text-black" : "bg-white/10"}`}>{t.name}</button>
        ))}</div>
        <button onClick={run} className="mt-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black text-sm font-medium">Run benchmarks</button>
      </div>
      <div className="overflow-x-auto glass rounded-xl">
        <table className="w-full text-xs">
          <thead className="text-slate-400 border-b border-white/5"><tr>
            <th className="p-2 text-left">Model</th><th className="p-2 text-left">Test</th><th className="p-2">Status</th><th className="p-2">TPS</th><th className="p-2">Latency</th><th className="p-2">Overall</th><th className="p-2">Published</th><th className="p-2">Action</th>
          </tr></thead>
          <tbody>
            {results.map((r: any) => (
              <tr key={r.id} className="border-b border-white/5">
                <td className="p-2">{r.model?.name}</td>
                <td className="p-2">{r.test?.name}</td>
                <td className="p-2 text-center">{r.status}</td>
                <td className="p-2 text-center">{r.tokensPerSecond != null ? Number(r.tokensPerSecond).toFixed(1) : "—"}</td>
                <td className="p-2 text-center">{r.latencyMs ?? "—"}</td>
                <td className="p-2 text-center">{r.overallScore != null ? Number(r.overallScore).toFixed(0) : "—"}</td>
                <td className="p-2 text-center">{r.published ? "Yes" : "No"}</td>
                <td className="p-2 text-center">
                  <button onClick={() => togglePublish(r)} className="px-2 py-0.5 rounded bg-white/10">{r.published ? "Unpublish" : "Publish"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BansTab({ data, refresh, setMsg }: any) {
  async function toggle(ban: any, next: boolean) {
    const res = await fetch("/api/admin/bans", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ip: ban.ip, banned: next }) });
    setMsg(res.ok ? (next ? "IP banned" : "IP unbanned") : "Failed");
    refresh();
  }
  return (
    <div className="overflow-x-auto glass rounded-xl">
      <table className="w-full text-xs">
        <thead className="text-slate-400 border-b border-white/5"><tr>
          <th className="p-2 text-left">IP</th><th className="p-2">Status</th><th className="p-2">Email</th><th className="p-2">Location</th><th className="p-2">Reason</th><th className="p-2">Expires</th><th className="p-2">Actions</th>
        </tr></thead>
        <tbody>
          {(data || []).map((b: any) => (
            <tr key={b.ip} className="border-b border-white/5">
              <td className="p-2 font-mono">{b.ip}</td>
              <td className="p-2 text-center">{b.banned ? "Banned" : "Cleared"}</td>
              <td className="p-2 text-center">{b.email || "—"}</td>
              <td className="p-2 text-center">{b.location ? `${b.location.city || ""}, ${b.location.country || ""}`.trim().replace(/^, |, $/g, "") : "—"}</td>
              <td className="p-2 text-center">{b.reason || "—"}</td>
              <td className="p-2 text-center">{b.expiresAt ? new Date(b.expiresAt).toLocaleString() : "—"}</td>
              <td className="p-2 text-center space-x-1">
                {b.banned ? (
                  <button onClick={() => toggle(b, false)} className="px-2 py-0.5 rounded bg-white/10">Unban</button>
                ) : (
                  <button onClick={() => toggle(b, true)} className="px-2 py-0.5 rounded bg-red-500/20 text-red-300">Ban again</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {(data || []).length === 0 && <div className="p-4 text-slate-400 text-sm">No IP records yet. Trigger an IP by attempting a jailbreak-style message.</div>}
    </div>
  );
}

function SettingsTab({ data, refresh, setMsg }: any) {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  async function save() {
    const res = await fetch("/api/admin/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) });
    setMsg(res.ok ? "Saved" : "Failed");
    setKey(""); setValue(""); refresh();
  }
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input value={key} onChange={e=>setKey(e.target.value)} placeholder="key" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm" />
        <input value={value} onChange={e=>setValue(e.target.value)} placeholder="value" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm flex-1" />
        <button onClick={save} className="px-4 py-2 rounded-lg bg-white text-black text-sm">Save</button>
      </div>
      <pre className="glass rounded-xl p-4 text-xs overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}