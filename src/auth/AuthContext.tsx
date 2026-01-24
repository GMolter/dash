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

  // Once true, the app has performed at least one session check.
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

// -----------------------------
// Local bootstrap cache
// -----------------------------
const BOOTSTRAP_KEY = 'olio.bootstrap.v1';

type BootstrapCache = {
  user?: any | null;
  orgId?: string | null;
  role?: Role | null;
  ts?: number;
};

function safeReadBootstrap(): BootstrapCache {
  try {
    const raw = localStorage.getItem(BOOTSTRAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as BootstrapCache;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function safeWriteBootstrap(next: BootstrapCache) {
  try {
    localStorage.setItem(
      BOOTSTRAP_KEY,
      JSON.stringify({
        user: next.user ?? null,
        orgId: next.orgId ?? null,
        role: next.role ?? null,
        ts: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

function safeClearBootstrap() {
  try {
    localStorage.removeItem(BOOTSTRAP_KEY);
  } catch {
    // ignore
  }
}

// Supabase stores the current session in localStorage under a key like:
// "sb-<project-ref>-auth-token"
function safeReadSupabaseSessionUser(): any | null {
  try {
    const keys = Object.keys(localStorage);
    const authKey = keys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (!authKey) return null;

    const raw = localStorage.getItem(authKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    // Supabase v2 stores either { currentSession } or { access_token, user, ... } depending on version/config
    const session = parsed?.currentSession ?? parsed;
    const u = session?.user ?? null;
    return u ?? null;
  } catch {
    return null;
  }
}

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
  // Bootstrap from localStorage so refreshes don't flash "blank/loading"
  const bootstrap = typeof window !== 'undefined' ? safeReadBootstrap() : {};

  const [loading, setLoading] = useState(() => {
    // If we have a cached user+orgId, don't consider ourselves "blocking/loading"
    return !(bootstrap?.user && bootstrap?.orgId);
  });

  const [hydrated, setHydrated] = useState(() => {
    // Treat cached state as hydrated enough to render immediately; we still verify in the background.
    return !!(bootstrap?.user && bootstrap?.orgId);
  });

  const [user, setUser] = useState<any | null>(() => bootstrap?.user ?? null);

  const [authError, setAuthError] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);

  const [orgLoading, setOrgLoading] = useState(() => {
    return !(bootstrap?.user && bootstrap?.orgId);
  });

  const [orgId, setOrgId] = useState<string | null>(() => bootstrap?.orgId ?? null);
  const [org, setOrg] = useState<Org | null>(null);
  const [role, setRole] = useState<Role | null>(() => (bootstrap?.role as Role) ?? null);

  // Prevent out-of-order org loads from leaving the app in a perpetual spinner.
  const orgLoadNonceRef = useRef<number>(0);

  const loadOrgState = async (uid: string) => {
    const myNonce = Date.now();
    orgLoadNonceRef.current = myNonce;

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
        safeWriteBootstrap({ user: uid ? { id: uid } : null, orgId: null, role: null });
        return;
      }

      const nextOrgId = profile.org_id ? String(profile.org_id) : null;
      const nextRole = ((profile.role as Role) ?? 'member') as Role;

      setOrgId(nextOrgId);
      setRole(nextRole);

      // Persist for instant refresh rendering
      safeWriteBootstrap({ user: { id: uid }, orgId: nextOrgId, role: nextRole });

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

    // If Supabase has a session cached, set user immediately (even before async getSession returns)
    try {
      const cachedSupabaseUser = safeReadSupabaseSessionUser();
      if (cachedSupabaseUser?.id && !user) {
        setUser(cachedSupabaseUser);
      }
    } catch {
      // ignore
    }

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
          safeClearBootstrap();
        }
      } catch (e: any) {
        setUser(null);
        setOrgId(null);
        setOrg(null);
        setRole(null);
        setOrgLoading(false);
        setAuthError(String(e?.message || e));
        safeClearBootstrap();
      } finally {
        setLoading(false);
        setHydrated(true);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      const sessionUser = session?.user ?? null;

      setUser(sessionUser);
      setAuthError(null);

      if (event === 'SIGNED_OUT' || !sessionUser?.id) {
        setOrgId(null);
        setOrg(null);
        setRole(null);
        setOrgError(null);
        setOrgLoading(false);
        setLoading(false);
        setHydrated(true);
        safeClearBootstrap();
        return;
      }

      await loadOrgState(sessionUser.id);

      setLoading(false);
      setHydrated(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
