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
  loading: boolean;
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
  // Some accounts may not have a profiles row yet; create it if missing.
  try {
    const { data: existing, error: readErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    // If RLS blocks select, readErr will exist; caller will fall back gracefully.
    if (readErr) return;

    if (!existing) {
      // Insert is best-effort: if RLS blocks it, we'll still proceed and treat as no-org.
      await supabase.from('profiles').insert({
        id: userId,
        org_id: null,
        role: 'member',
      });
    }
  } catch {
    // Swallow any unexpected client/network issues.
    return;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
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

    setOrgLoading(true);
    setOrgError(null);

    try {
      // Ensure profile exists (best effort)
      await ensureProfileRow(uid);

      // Read profile -> org_id + role
      const { data: profile, error: profErr } = await supabase
        .from('profiles')
        .select('org_id, role')
        .eq('id', uid)
        .single();

      // If another load started since we began, ignore this result.
      if (orgLoadNonceRef.current !== myNonce) return;

      if (profErr || !profile) {
        // If this fails, we can't know org membership -> treat as no org, but stop spinner.
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

      // Read org row (needs org SELECT policy)
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
      // Any unexpected runtime/network errors should never leave the app stuck.
      setOrgId(null);
      setOrg(null);
      setRole(null);
      setOrgError(String(e?.message || e));
    } finally {
      // Always stop the spinner for the latest request.
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
        // If anything goes sideways, never leave the app in an infinite "Loading…" state.
        setUser(null);
        setOrgId(null);
        setOrg(null);
        setRole(null);
        setOrgLoading(false);
        setAuthError(String(e?.message || e));
      } finally {
        setLoading(false);
      }
    };

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      // Important: don’t allow loading to remain true if init failed earlier.
      setLoading(false);
      setAuthError(null);

      if (sessionUser?.id) {
        await loadOrgState(sessionUser.id);
      } else {
        setOrgLoading(false);
        setOrgId(null);
        setOrg(null);
        setRole(null);
        setOrgError(null);
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
    [loading, user, authError, orgLoading, orgId, org, role, orgError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
