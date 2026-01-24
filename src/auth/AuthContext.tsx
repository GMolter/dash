import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  // Initial auth hydrate/loading (first paint)
  loading: boolean;

  // Once true, the app should NEVER full-screen-block again for org refreshes
  hydrated: boolean;

  user: any | null;

  // Optional diagnostics (helps when auth/org lookups are blocked by RLS)
  authError?: string | null;
  orgError?: string | null;

  orgLoading: boolean;
  orgId: string | null;
  org: Org | null;
  role: Role | null;

  reloadOrg: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

async function ensureProfileRow(userId: string) {
  try {
    const { data: existing, error: readErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (readErr) return;

    if (!existing) {
      await supabase.from('profiles').insert({
        id: userId,
        org_id: null,
        role: 'member',
      });
    }
  } catch {
    return;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  const [user, setUser] = useState<any | null>(null);

  const [authError, setAuthError] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [orgLoading, setOrgLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  // Prevent out-of-order org loads from leaving the app in a perpetual spinner.
  const orgLoadNonceRef = useRef<number>(0);

  const loadOrgState = async (uid: string) => {
    const myNonce = Date.now();
    orgLoadNonceRef.current = myNonce;

    // ✅ allow background refreshes without "big block" if already hydrated
    setOrgLoading(true);
    setOrgError(null);

    try {
      await ensureProfileRow(uid);

      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('org_id, role')
        .eq('id', uid)
        .single();

      if (orgLoadNonceRef.current !== myNonce) return;

      if (profErr || !profile) {
        setOrgId(null);
        setOrg(null);
        setRole(null);
        setOrgError(profErr?.message || null);
        return;
      }

      const nextOrgId = profile.org_id ? String(profile.org_id) : null;
      setOrgId(nextOrgId);
      setRole((profile.role as Role) ?? 'member');

      if (!nextOrgId) {
        setOrg(null);
        return;
      }

      const { data: orgRow, error: orgErr } = await supabase
        .from('organizations')
        .select('id,name,icon_color,code,owner_id')
        .eq('id', nextOrgId)
        .single();

      if (orgLoadNonceRef.current !== myNonce) return;

      if (orgErr || !orgRow) {
        setOrg(null);
        setOrgError(orgErr?.message || null);
        return;
      }

      setOrg(orgRow as Org);
    } catch (e: any) {
      setOrgId(null);
      setOrg(null);
      setRole(null);
      setOrgError(String(e?.message || e));
    } finally {
      if (orgLoadNonceRef.current === myNonce) setOrgLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      setAuthError(null);

      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;

        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser?.id) {
          await loadOrgState(sessionUser.id);
        } else {
          setOrgLoading(false);
          setOrgId(null);
          setOrg(null);
          setRole(null);
        }
      } catch (e: any) {
        setUser(null);
        setOrgId(null);
        setOrg(null);
        setRole(null);
        setOrgLoading(false);
        setAuthError(String(e?.message || e));
      } finally {
        // ✅ "first hydrate" completes here
        setLoading(false);
        setHydrated(true);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user ?? null;

      // Always track user changes
      setUser(sessionUser);
      setAuthError(null);

      // ✅ If already hydrated, NEVER revert to a full-screen loading gate.
      // We can still refresh org data in the background.
      if (event === 'SIGNED_OUT' || !sessionUser?.id) {
        setOrgId(null);
        setOrg(null);
        setRole(null);
        setOrgError(null);
        setOrgLoading(false);
        setLoading(false);
        setHydrated(true);
        return;
      }

      // For SIGNED_IN / TOKEN_REFRESHED / USER_UPDATED etc:
      await loadOrgState(sessionUser.id);

      // Ensure we don't regress UI to "initial loading"
      setLoading(false);
      setHydrated(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      loading,
      hydrated,
      user,
      authError,
      orgLoading,
      orgId,
      org,
      role,
      orgError,
      reloadOrg: async () => {
        if (!user?.id) return;
        await loadOrgState(user.id);
      },
    }),
    [loading, hydrated, user, authError, orgLoading, orgId, org, role, orgError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
