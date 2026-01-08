import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Shield, Users, Settings, Trash2 } from 'lucide-react';

type Role = 'member' | 'admin' | 'owner';

type Member = {
  id: string;
  role: Role;
  display_name: string | null;
};

export function OrganizationPage() {
  const { org, user } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<'overview' | 'manage'>('overview');
  const [loading, setLoading] = useState(true);

  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!org) return;

    setLoading(true);
    supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('org_id', org.id)
      .then(({ data, error }) => {
        if (!error) setMembers(data || []);
        setLoading(false);
      });
  }, [org]);

  const myRole = useMemo(() => {
    return members.find((m) => m.id === user?.id)?.role ?? 'member';
  }, [members, user]);

  const canManage = myRole === 'owner' || myRole === 'admin';
  const isOwner = myRole === 'owner';

  const updateRole = async (id: string, role: Role) => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role } : m))
    );
  };

  const deleteOrganization = async () => {
    if (!org || !isOwner) return;
    if (confirmText !== org.name) return;

    setDeleting(true);

    try {
      // Remove org reference from members
      await supabase.from('profiles').update({ org_id: null, role: 'member' }).eq('org_id', org.id);

      // Delete org
      await supabase.from('organizations').delete().eq('id', org.id);

      // Force reload
      window.location.reload();
    } catch {
      setDeleting(false);
    }
  };

  if (!org) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <div>
        <h2 className="text-3xl font-semibold text-white">Organization</h2>
        <p className="mt-2 text-slate-300">
          Shared information and settings for your organization.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800/60">
        <TabButton active={tab === 'overview'} onClick={() => setTab('overview')} icon={<Users className="w-4 h-4" />} label="Overview" />
        {canManage && (
          <TabButton active={tab === 'manage'} onClick={() => setTab('manage')} icon={<Settings className="w-4 h-4" />} label="Manage" />
        )}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 backdrop-blur p-7">
            <div className="text-sm uppercase tracking-wide text-blue-200">Organization Code</div>
            <div className="mt-3 flex items-center gap-4">
              <div className="font-mono text-4xl tracking-widest text-white">{org.code}</div>
              <button
                onClick={() => navigator.clipboard.writeText(org.code)}
                className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium"
              >
                Copy
              </button>
            </div>
          </div>

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
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-2xl bg-slate-900/40 border border-slate-800/60 px-4 py-3">
                    <div>
                      <div className="text-slate-100 font-medium">
                        {m.display_name ?? 'Unnamed User'}
                      </div>
                      <div className="text-xs text-slate-400">{m.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANAGE */}
      {tab === 'manage' && canManage && (
        <div className="space-y-10">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-slate-300" />
              <h3 className="text-lg font-medium text-white">Member Roles</h3>
            </div>

            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 px-4 py-3">
                  <div className="text-slate-100">
                    {m.display_name ?? 'Unnamed User'}
                  </div>

                  {m.role === 'owner' ? (
                    <span className="text-purple-300 text-sm">Owner</span>
                  ) : (
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value as Role)}
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

          {/* OWNER DELETE */}
          {isOwner && (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 backdrop-blur p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-300">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Delete Organization</h3>
              </div>

              <p className="text-sm text-red-200">
                This permanently deletes the organization and removes all members.
                This action cannot be undone.
              </p>

              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${org.name}" to confirm`}
                className="w-full rounded-2xl bg-slate-900/60 border border-red-500/40 px-4 py-3 text-sm"
              />

              <button
                disabled={confirmText !== org.name || deleting}
                onClick={deleteOrganization}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors font-medium"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? 'Deleting…' : 'Delete Organization'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- helpers ---------- */

function TabButton({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
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
