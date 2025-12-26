import React, { useEffect, useState } from "react";

export default function Admin() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function refresh() {
    const r = await fetch("/api/admin/me", { credentials: "include" });
    const j = await r.json();
    setAuthed(Boolean(j.authed));
  }

  useEffect(() => { refresh(); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const r = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password }),
    });

    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Login failed");
      return;
    }

    setPassword("");
    await refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST", credentials: "include" });
    await refresh();
  }

  if (authed === null) return <div className="p-6 text-slate-200">Loading…</div>;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <form
          onSubmit={login}
          className="w-full max-w-sm rounded-xl bg-slate-900/60 p-6 border border-slate-800"
        >
          <h1 className="text-xl font-semibold text-slate-100">Admin</h1>
          <p className="text-slate-400 mt-1">Enter password to unlock.</p>

          <input
            className="mt-4 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-slate-100"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
          />

          {err && <div className="mt-3 text-red-400 text-sm">{err}</div>}

          <button className="mt-4 w-full rounded-lg bg-white/10 hover:bg-white/15 text-slate-100 py-2 border border-slate-700">
            Unlock
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-100">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin Panel</h1>
        <button
          onClick={logout}
          className="rounded-lg px-3 py-2 bg-white/10 hover:bg-white/15 border border-slate-700"
        >
          Logout
        </button>
      </div>

      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-slate-300">
        Next up: Search + Secrets manager + Audit log + Maintenance banner + Home ordering.
      </div>
    </div>
  );
}
