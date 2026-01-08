import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../auth/AuthContext';

type Member = {
  id: string;
  role: 'member' | 'admin' | 'owner';
};

export function OrganizationPage() {
  const { org, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [tab, setTab] = useState<'overview' | 'manage'>('overview');

  const isPrivileged =
    members.find((m) => m.id === user?.id)?.role === 'owner' ||
    members.find((m) => m.id === user?.id)?.role === 'admin';

  useEffect(() => {
    if (!org) return;

    supabase
      .from('profiles')
      .select('id,role')
      .eq('org_id', org.id)
      .then(({ data }) => setMembers(data || []));
  }, [org]);

  const updateRole = async (id: string, role: 'member' | 'admin') => {
    await supabase.from('profiles').update({ role }).eq('id', id);
    setMembers((m) => m.map((u) => (u.id === id ? { ...u, role } : u)));
  };

  if (!org) return null;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex gap-4 border-b">
        <button onClick={() => setTab('overview')} className="tab">
          Overview
        </button>
        {isPrivileged && (
          <button onClick={() => setTab('manage')} className="tab">
            Manage
          </button>
        )}
      </div>

      {tab === 'overview' && (
        <>
          <div className="card">
            <div className="label">Organization Code</div>
            <div className="code">{org.code}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
              <div className="label">Name</div>
              <div>{org.name}</div>
            </div>
            <div className="card">
              <div className="label">Color</div>
              <div className="h-8 w-8 rounded" style={{ background: org.icon_color }} />
            </div>
          </div>

          <div className="card">
            <div className="label mb-2">Members</div>
            <div className="space-y-2">
              {members.map((m) => (
                <div key={m.id} className="flex justify-between">
                  <span>{m.id.slice(0, 8)}</span>
                  <span className="badge">{m.role}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === 'manage' && (
        <div className="card space-y-4">
          <div className="label">Manage Members</div>
          {members.map((m) => (
            <div key={m.id} className="flex justify-between items-center">
              <span>{m.id.slice(0, 8)}</span>
              {m.role !== 'owner' && (
                <select
                  value={m.role}
                  onChange={(e) => updateRole(m.id, e.target.value as any)}
                  className="input"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
