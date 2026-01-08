import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Role = 'member' | 'admin' | 'owner';

type Org = {
  id: string;
  name: string;
  icon_color: string;
  code: string;
  owner_id: string;
};

type AuthContextType = {
  loading: boolean;
  user: any | null;

  orgLoading: boolean;
  orgId: string | null;
  org: Org | null;
  role: Role | null;

  reloadOrg: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function ensureProfileRow(userId: string) {
  // Some accounts may not have a profiles row yet; create it if missing.
  const { data: existing, error: readErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  // If RLS blocks select, readErr will exist; let caller handle that.
  if (readErr) return;

  if (!existing) {
    await supabase.from('profiles').insert({
      id: userId,
      org_id: null,
      role: 'member',
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any | null>(null);

  const [orgLoading, setOrgLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  const loadOrgState = async (uid: string) => {
    setOrgLoading(true);

    // Ensure profile exists (best effort)
    await ensureProfileRow(uid);

    // Read profile -> org_id + role
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', uid)
      .single();

    if (profErr || !profile) {
      // If this fails, we can't know org membership -> treat as no org, but stop spinner.
      setOrgId(null);
      setOrg(null);
      setRole(null);
      setOrgLoading(false);
      return;
    }

    const nextOrgId = profile.org_id ? String(profile.org_id) : null;
    setOrgId(nextOrgId);
    setRole((profile.role as Role) ?? 'member');

    if (!nextOrgId) {
      setOrg(null);
      setOrgLoading(false);
      return;
    }

    // Read org row (needs org SELECT policy)
    const { data: orgRow, error: orgErr } = await supabase
      .from('organizations')
      .select('id,name,icon_color,code,owner_id')
      .eq('id', nextOrgId)
      .single();

    if (orgErr || !orgRow) {
      setOrg(null);
      setOrgLoading(false);
      return;
    }

    setOrg(orgRow as Org);
    setOrgLoading(false);
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      const sessionUser = data.session?.user ?? null;
      setUser(sessionUser);
      setLoading(false);

      if (sessionUser?.id) {
        await loadOrgState(sessionUser.id);
      } else {
        setOrgLoading(false);
        setOrgId(null);
        setOrg(null);
        setRole(null);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (sessionUser?.id) {
        await loadOrgState(sessionUser.id);
      } else {
        setOrgLoading(false);
        setOrgId(null);
        setOrg(null);
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      loading,
      user,
      orgLoading,
      orgId,
      org,
      role,
      reloadOrg: async () => {
        if (!user?.id) return;
        await loadOrgState(user.id);
      },
    }),
    [loading, user, orgLoading, orgId, org, role]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
