import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type Org = {
  id: string;
  name: string;
  icon_color: string;
  code?: string;
  owner_id?: string;
  created_at?: string;
};

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  orgLoading: boolean;
  org: Org | null;
  orgId: string | null;
  reloadOrg: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function safeString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v : null;
}

async function tryLoadOrgFromDb(userId: string) {
  const profileRes = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .maybeSingle();

  if (profileRes.error) throw profileRes.error;
  const orgId = safeString((profileRes.data as any)?.org_id);
  if (!orgId) return { orgId: null, org: null as Org | null };

  const orgRes = await supabase
    .from('organizations')
    .select('id,name,icon_color,code,owner_id,created_at')
    .eq('id', orgId)
    .maybeSingle();

  if (orgRes.error) throw orgRes.error;
  return { orgId, org: (orgRes.data as Org | null) ?? null };
}

function loadOrgFromUserMetadata(user: User) {
  const orgId = safeString((user.user_metadata as any)?.org_id);
  const orgName = safeString((user.user_metadata as any)?.org_name);
  const orgColor = safeString((user.user_metadata as any)?.org_icon_color);

  if (!orgId || !orgName || !orgColor) {
    return { orgId: null, org: null as Org | null };
  }

  return {
    orgId,
    org: {
      id: orgId,
      name: orgName,
      icon_color: orgColor,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const [orgLoading, setOrgLoading] = useState(false);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [org, setOrg] = useState<Org | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;

      setSession(data.session ?? null);
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    init();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, newSession: Session | null) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const reloadOrg = async () => {
    if (!user) {
      setOrgId(null);
      setOrg(null);
      return;
    }

    setOrgLoading(true);
    try {
      // Try DB-backed org system first.
      try {
        const loaded = await tryLoadOrgFromDb(user.id);
        setOrgId(loaded.orgId);
        setOrg(loaded.org);
        return;
      } catch {
        // Fall back to user_metadata-based org details.
        const loaded = loadOrgFromUserMetadata(user);
        setOrgId(loaded.orgId);
        setOrg(loaded.org);
        return;
      }
    } finally {
      setOrgLoading(false);
    }
  };

  useEffect(() => {
    if (!loading) reloadOrg();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user?.id]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setOrgId(null);
    setOrg(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user,
      orgLoading,
      org,
      orgId,
      reloadOrg,
      signOut,
    }),
    [loading, session, user, orgLoading, org, orgId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
