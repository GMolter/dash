import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

type Mode = 'join' | 'create';

const ORG_COLORS = [
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f59e0b', // amber
  '#22c55e', // green
  '#14b8a6', // teal
  '#0ea5e9', // sky
];

function random4DigitCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function generateUniqueCode() {
  for (let i = 0; i < 20; i++) {
    const code = random4DigitCode();
    const { data } = await supabase
      .from('organizations')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (!data) return code;
  }
  throw new Error('Failed to generate unique org code');
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

  const joinOrg = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);

    try {
      const { data: org } = await supabase
        .from('organizations')
        .select('id,name,icon_color')
        .eq('code', joinCode)
        .single();

      if (!org) throw new Error('Invalid organization code');

      await supabase.from('profiles').upsert({
        id: user.id,
        org_id: org.id,
        role: 'member',
      });

      await reloadOrg();
    } catch (e: any) {
      setError(e.message || 'Failed to join organization');
    } finally {
      setBusy(false);
    }
  };

  const createOrg = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);

    try {
      const code = await generateUniqueCode();

      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          icon_color: orgColor,
          owner_id: user.id,
          code,
        })
        .select('id')
        .single();

      if (!org) throw new Error('Failed to create organization');

      await supabase.from('profiles').upsert({
        id: user.id,
        org_id: org.id,
        role: 'owner',
      });

      await reloadOrg();
    } catch (e: any) {
      setError(e.message || 'Failed to create organization');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white p-6">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur p-7 space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">Organization</h1>
          <p className="text-slate-300 mt-1">
            Join an existing organization or create a new one.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('join')}
            className={`rounded-xl py-3 ${
              mode === 'join'
                ? 'bg-blue-600'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            Join
          </button>
          <button
            onClick={() => setMode('create')}
            className={`rounded-xl py-3 ${
              mode === 'create'
                ? 'bg-blue-600'
                : 'bg-slate-800 hover:bg-slate-700'
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
              className="w-full text-center tracking-widest text-xl rounded-xl bg-slate-800 border border-slate-700 py-3"
            />
            <button
              disabled={!canJoin || busy}
              onClick={joinOrg}
              className="w-full rounded-xl bg-blue-600 py-3 disabled:opacity-50"
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
              className="w-full rounded-xl bg-slate-800 border border-slate-700 py-3 px-4"
            />

            <div>
              <p className="text-sm text-slate-300 mb-2">Icon Color</p>
              <div className="grid grid-cols-5 gap-3">
                {ORG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setOrgColor(color)}
                    className={`h-10 w-10 rounded-xl border ${
                      orgColor === color
                        ? 'ring-2 ring-blue-400 border-white'
                        : 'border-slate-700'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <button
              disabled={!canCreate || busy}
              onClick={createOrg}
              className="w-full rounded-xl bg-blue-600 py-3 disabled:opacity-50"
            >
              Create Organization
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-500/20 border border-red-500/40 px-4 py-3 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
