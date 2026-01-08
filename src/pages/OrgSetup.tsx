import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

type Mode = 'join' | 'create';

function makeJoinCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function persistOrgToProfile(
  userId: string,
  org: { id: string; name: string; icon_color: string },
  role: 'owner' | 'member'
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
  const [orgColor, setOrgColor] = useState('#3b82f6');

  const canJoin = joinCode.trim().length === 4;
  const canCreate = orgName.trim().length >= 2;

  const onJoin = async () => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const code = joinCode.trim();

      const { data: org } = await supabase
        .from('organizations')
        .select('id,name,icon_color')
        .eq('code', code)
        .single();

      if (!org) throw new Error('Invalid organization code');

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
      const { data: org } = await supabase
        .from('organizations')
        .insert({
          name: orgName.trim(),
          icon_color: orgColor,
          owner_id: user.id,
          code: makeJoinCode(),
        })
        .select('id,name,icon_color')
        .single();

      if (!org) throw new Error('Failed to create org');

      await persistOrgToProfile(user.id, org, 'owner');
      await reloadOrg();
    } catch (e: any) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex gap-2">
          <button onClick={() => setMode('join')} className="flex-1 btn">Join</button>
          <button onClick={() => setMode('create')} className="flex-1 btn">Create</button>
        </div>

        {mode === 'join' ? (
          <>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.replace(/\D/g, ''))}
              maxLength={4}
              placeholder="4-digit code"
              className="input text-center tracking-widest text-2xl"
            />
            <button disabled={!canJoin || busy} onClick={onJoin} className="btn-primary">
              Join Organization
            </button>
          </>
        ) : (
          <>
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              className="input"
            />
            <input type="color" value={orgColor} onChange={(e) => setOrgColor(e.target.value)} />
            <button disabled={!canCreate || busy} onClick={onCreate} className="btn-primary">
              Create Organization
            </button>
          </>
        )}

        {error && <div className="error">{error}</div>}
      </div>
    </div>
  );
}
