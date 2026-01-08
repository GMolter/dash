import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Org = {
  id: string;
  name: string;
  icon_color: string;
  code: string;
};

type AuthContextType = {
  user: any;
  org: Org | null;
  role: 'member' | 'admin' | 'owner' | null;
  loading: boolean;
  orgLoading: boolean;
  reloadOrg: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [org, setOrg] = useState<Org | null>(null);
  const [role, setRole] = useState<'member' | 'admin' | 'owner' | null>(null);
  const [loading, setLoading] = useState(true);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoading(false);
      if (data.user) await loadOrg(data.user.id);
      else setOrgLoading(false);
    };

    init();

    const { data: listener } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadOrg(session.user.id);
      else {
        setOrg(null);
        setRole(null);
        setOrgLoading(false);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadOrg = async (userId: string) => {
    setOrgLoading(true);

    // Always read profile first (role + org_id)
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', userId)
      .single();

    if (!profile?.org_id) {
      setOrg(null);
      setRole(null);
      setOrgLoading(false);
      return;
    }

    setRole(profile.role);

    const { data: orgData } = await supabase
      .from('organizations')
      .select('id, name, icon_color, code')
      .eq('id', profile.org_id)
      .single();

    setOrg(orgData ?? null);
    setOrgLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        org,
        role,
        loading,
        orgLoading,
        reloadOrg: async () => {
          if (user) await loadOrg(user.id);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
