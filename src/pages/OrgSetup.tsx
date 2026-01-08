import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

type Mode = 'join' | 'create';

const ORG_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#ef4444', // red
  '#f97316', // orange
  '#facc15', // yellow
  '#22c55e', // green
  '#14b8a6', // teal
  '#64748b', // slate
];

function makeJoinCode4() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function generateUniqueJoinCode4(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = makeJoinCode4();
    const { data, error } = await supabase.from('organizations').select('id').eq('code', code).maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  throw new Error('Unable to generate a unique 4-digit org code. Please try again.');
}

async function persistOrgToProfile(
  userId: string,
  org: { id: string; name: string; icon_color: string },
  role: 'member' | 'admin' | 'owner'
) {
  await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        org_id: org.id,
        role,
      },
      { onConflict: 'id' }
    );

  // Always also set user_metadata as a safety net (lets UI recover even if DB select fails).
  await supabase.auth.updateUser({
    data: {
      org_id: org.id,
      org_name: org.name,
      org_icon_color: org.icon_color,
    },
  });
}

export function OrgSetup() {
  const { user, reloadOrg } = useAuth();
  const [mode, setMode] = useState<Mode>('join');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [joinCode, setJoinCode] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgColor, setOrgColor] = useState(ORG_COLORS[0]);

  const canJoin = useMemo(() => joinCode.trim().length === 4, [joinCode]);
  const canCreate = useMemo(() => orgName.trim().length >= 2, [orgName]);

  const onJoin = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const code = joinCode.trim();

      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .select('id,name,icon_color')
        .eq('code', code)
        .maybeSingle();

      if (orgErr) throw orgErr;
      if (!org) throw new Error('Invalid organization code');

      await persistOrgToProfile(user.id, org as any, 'member');
      await reloadOrg();
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const onCreate = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const code = await generateUniqueJoinCode4();

      const payload = {
        name: orgName.trim(),
        icon_color: orgColor,
        owner_id: user.id,
        code,
      };

      const { data: org, error: orgErr } = await supabase
        .from('organizations')
        .insert(payload)
        .select('id,name,icon_color')
        .single();

      if (orgErr) throw orgErr;
      if (!org) throw new Error('Failed to create organization');

      await persistOrgToProfile(user.id, org as any, 'owner');
      await reloadOrg();
    } catch (e: any) {
      const msg = String(e?.message || e);
      setError(
        msg.includes('relation') || msg.includes('organizations') || msg.includes('profiles')
          ? `${msg}\n\nOrg setup needs Supabase tables (profiles, organizations) + RLS policies.`
          : msg
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_25%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_75%_30%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(14,165,233,0.25),transparent_45%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-lg rounded-3xl border border-slate-800/60 bg-slate-950/60 backdrop-blur p-7 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Organization</h1>
            <p className="mt-2 text-slate-300">Join your team with a code — or create a new org.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setMode('join')}
              className={`px-4 py-3 rounded-2xl border transition-colors ${
                mode === 'join'
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                  : 'border-slate-800/60 hover:bg-slate-800/40 text-slate-200'
              }`}
            >
              Join
            </button>
            <button
              onClick={() => setMode('create')}
              className={`px-4 py-3 rounded-2xl border transition-colors ${
                mode === 'create'
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                  : 'border-slate-800/60 hover:bg-slate-800/40 text-slate-200'
              }`}
            >
              Create
            </button>
          </div>

          {mode === 'join' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Organization Code</label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-center tracking-widest text-lg"
                  placeholder="1234"
                  inputMode="numeric"
                />
              </div>

              <button
                onClick={onJoin}
                disabled={!canJoin || busy}
                className="w-full px-4 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors font-medium"
              >
                {busy ? 'Working…' : 'Join Organization'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Organization Name</label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="My Team"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-3">Organization Color</label>
                <div className="grid grid-cols-5 gap-3">
                  {ORG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setOrgColor(c)}
                      className={`h-10 w-10 rounded-xl border transition ${
                        orgColor === c ? 'border-white ring-2 ring-white/40' : 'border-slate-800/70'
                      }`}
                      style={{ backgroundColor: c }}
                      aria-label={`Select color ${c}`}
                    />
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-3 text-sm text-slate-300">
                  <div className="h-8 w-8 rounded-xl border border-slate-800/70" style={{ backgroundColor: orgColor }} />
                  <span className="font-mono">{orgColor}</span>
                </div>
              </div>

              <button
                onClick={onCreate}
                disabled={!canCreate || busy}
                className="w-full px-4 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors font-medium"
              >
                {busy ? 'Working…' : 'Create Organization'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-5 whitespace-pre-wrap rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100 text-sm">
              {error}
            </div>
          )}

          <p className="mt-6 text-xs text-slate-400 leading-relaxed">
            Each account can only be in (or host) one organization at a time.
          </p>
        </div>
      </div>
    </div>
  );
}
