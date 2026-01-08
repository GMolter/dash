import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Shield, Users, Settings } from 'lucide-react';

type Role = 'member' | 'admin' | 'owner';

type Member = {
  id: string;
  role: Role;
};

export function OrganizationPage() {
  const { org, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<'overview' | 'manage'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!org) return;

    setLoading(true);
    supabase
      .from('profiles')
      .select('id, role')
      .eq('org_id', org.id)
      .then(({ data }) => {
        setMembers(data || []);
        setLoading(false);
      });
  }, [org]);

  const myRole = useMemo(() => {
    return members.find((m) => m.id === user?.id)?.role ?? 'member';
  }, [members, user]);

  const canManage = myRole === 'owner' || myRole === 'admin';

  const updateRole = async (id: string, role: Role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role } : m))
    );
  };

  if (!org) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-white">Organization</h2>
        <p className="mt-2 text-slate-300">
          Shared information and settings for your organization.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800/60">
        <TabButton
          active={tab === 'overview'}
          onClick={() => setTab('overview')}
          icon={<Users className="w-4 h-4" />}
          label="Overview"
        />
        {canManage && (
          <TabButton
            active={tab === 'manage'}
            onClick={() => setTab('manage')}
            icon={<Settings className="w-4 h-4" />}
            label="Manage"
          />
        )}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="grid gap-8">
          {/* Org Code */}
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 backdrop-blur p-7">
            <div className="text-sm uppercase tracking-wide text-blue-200">
              Organization Code
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="font-mono text-4xl tracking-widest text-white">
                {org.code}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(org.code)}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium"
              >
                Copy
              </button>
            </div>
          </div>

          {/* Org Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <InfoCard label="Organization Name">
              {org.name}
            </InfoCard>

            <InfoCard label="Brand Color">
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-xl border border-slate-700"
                  style={{ backgroundColor: org.icon_color }}
                />
                <span className="font-mono text-slate-300">
                  {org.icon_color}
                </span>
              </div>
            </InfoCard>
          </div>

          {/* Members */}
          <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-slate-300" />
              <h3 className="text-lg font-medium text-white">
                Members ({members.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-slate-400">Loading members…</div>
            ) : (
              <div className="space-y-3">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-2xl bg-slate-900/40 border border-slate-800/60 px-4 py-3"
                  >
                    <div className="font-mono text-sm text-slate-300">
                      {m.id.slice(0, 8)}
                    </div>
                    <RoleBadge role={m.role} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANAGE */}
      {tab === 'manage' && canManage && (
        <div className="rounded-3xl border border-amber-500/25 bg-amber-500/10 backdrop-blur p-7 space-y-6">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-300" />
            <h3 className="text-xl font-semibold text-white">
              Organization Management
            </h3>
          </div>

          <p className="text-slate-300 max-w-2xl">
            Admins can manage members. Only the owner can delete the organization.
          </p>

          <div className="space-y-4">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-slate-900/40 border border-slate-800/60 px-4 py-3"
              >
                <div className="font-mono text-sm text-slate-300">
                  {m.id.slice(0, 8)}
                </div>

                {m.role === 'owner' ? (
                  <RoleBadge role="owner" />
                ) : (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      updateRole(m.id, e.target.value as Role)
                    }
                    className="rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Small UI helpers ---------- */

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-t-xl border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-200'
          : 'border-transparent text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function InfoCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
      <div className="text-sm text-slate-400 mb-1">{label}</div>
      <div className="text-lg text-slate-100">{children}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: Role }) {
  const styles: Record<Role, string> = {
    owner: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    admin: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    member: 'bg-slate-700/40 text-slate-200 border-slate-600/40',
  };

  return (
    <span
      className={`px-3 py-1.5 rounded-xl text-xs font-medium border ${styles[role]}`}
    >
      {role}
    </span>
  );
}
