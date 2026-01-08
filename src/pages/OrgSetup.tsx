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

async function generateUniqueJoinCode4(maxAttempts = 20) {
  for (let i = 0; i < maxAttempts; i++) {
    const code = makeJoinCode4();
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (!data) return code;
  }

  throw new Error('Failed to generate unique organization code.');
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

  const canJoin = useMemo(() => joinCode.length === 4, [joinCode]);
  const canCreate = useMemo(() => orgName.trim().length >= 2, [orgName]);

  const onJoin = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);

    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('id,name,icon_color')
        .eq('code', joinCode)
        .maybeSingle();

      if (!org) throw new Error('Invalid organization code.');

      await persistOrgToProfile(user.id, org, 'member');
      await reloadOrg();
    } catch (e: any) {
      setError(String(e.message || e));
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

      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          icon_color: orgColor,
          owner_id: user.id,
          code,
        })
        .select('id,name,icon_color')
        .single();

      if (!org) throw new Error('Failed to create organization.');

      await persistOrgToProfile(user.id, org, 'owner');
      await reloadOrg();
    } catch (e: any) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800/60 bg-slate-900/60 backdrop-blur p-7 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Organization</h1>
          <p className="text-slate-300 mt-1">
            Join an existing org or create a new one.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('join')}
            className={`px-4 py-3 rounded-2xl border ${
              mode === 'join'
                ? 'bg-blue-500/20 border-blue-500/30'
                : 'border-slate-800/60'
            }`}
          >
            Join
          </button>
          <button
            onClick={() => setMode('create')}
            className={`px-4 py-3 rounded-2xl border ${
              mode === 'create'
                ? 'bg-blue-500/20 border-blue-500/30'
                : 'border-slate-800/60'
            }`}
          >
            Create
          </button>
        </div>

        {mode === 'join' && (
          <div className="space-y-4">
            <input
              value={joinCode}
              onChange={(e) =>
                setJoinCode(e.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="4-digit code"
              className="w-full text-center text-xl tracking-widest px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700"
            />
            <button
              disabled={!canJoin || busy}
              onClick={onJoin}
              className="w-full px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              Join Organization
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div className="space-y-4">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              className="w-full px-4 py-3 rounded-2xl bg-slate-800/60 border border-slate-700"
            />

            <div>
              <p className="text-sm text-slate-300 mb-2">
                Organization Color
              </p>
              <div className="grid grid-cols-5 gap-3">
                {ORG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setOrgColor(color)}
                    className={`h-10 w-10 rounded-xl border ${
                      orgColor === color
                        ? 'ring-2 ring-white border-white'
                        : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              disabled={!canCreate || busy}
              onClick={onCreate}
              className="w-full px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
            >
              Create Organization
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
