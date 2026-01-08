import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';
import { Users, Settings, Trash2 } from 'lucide-react';

type Role = 'member' | 'admin' | 'owner';

type Member = {
  id: string;
  role: Role;
  display_name: string | null;
};

export function OrganizationPage() {
  const { org, role } = useAuth();

  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<'overview' | 'manage'>('overview');
  const [loading, setLoading] = useState(true);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const canManage = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';

  useEffect(() => {
    if (!org) return;

    setLoading(true);
    supabase
      .from('profiles')
      .select('id, role, display_name')
      .eq('org_id', org.id)
      .then(({ data }) => {
        setMembers(data || []);
        setLoading(false);
      });
  }, [org]);

  const updateRole = async (id: string, newRole: Role) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  const deleteOrganization = async () => {
    if (!org || !isOwner || confirmText !== org.name) return;

    setDeleting(true);
    await supabase.from('profiles').update({ org_id: null, role: 'member' }).eq('org_id', org.id);
    await supabase.from('organizations').delete().eq('id', org.id);
    window.location.reload();
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

      <div className="flex gap-2 border-b border-slate-800/60">
        <button onClick={() => setTab('overview')} className={tab === 'overview' ? 'tab-active' : 'tab'}>
          Overview
        </button>
        {canManage && (
          <button onClick={() => setTab('manage')} className={tab === 'manage' ? 'tab-active' : 'tab'}>
            Manage
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 backdrop-blur p-7">
            <div className="text-sm uppercase tracking-wide text-blue-200">Organization Code</div>
            <div className="mt-3 flex items-center gap-4">
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

      {tab === 'manage' && canManage && (
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
            <h3 className="text-lg font-medium text-white mb-4">Member Roles</h3>
            <div className="space-y-3">
              {members.map((m) => (
                <div key={m.id} className="flex justify-between items-center rounded-2xl bg-slate-900/40 border border-slate-800/60 px-4 py-3">
                  <span>{m.display_name ?? 'Unnamed User'}</span>
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

          {isOwner && (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 backdrop-blur p-6 space-y-4">
              <div className="flex items-center gap-2 text-red-300">
                <Trash2 className="w-5 h-5" />
                <h3 className="text-lg font-semibold">Delete Organization</h3>
              </div>

              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={`Type "${org.name}" to confirm`}
                className="w-full rounded-2xl bg-slate-900/60 border border-red-500/40 px-4 py-3 text-sm"
              />

              <button
                disabled={confirmText !== org.name || deleting}
                onClick={deleteOrganization}
                className="w-full px-4 py-3 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors font-medium"
              >
                {deleting ? 'Deleting…' : 'Delete Organization'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
