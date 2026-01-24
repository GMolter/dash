import { useState } from 'react';
import { useOrg } from '../hooks/useOrg';
import { usePermission } from '../hooks/usePermission';
import { Building2, Copy, Users, Settings, Crown, Shield as ShieldIcon, User } from 'lucide-react';

const PRESET_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Slate', value: '#64748b' },
];

type Tab = 'overview' | 'manage';

export function OrganizationPage() {
  const { organization, members, updateOrg, updateMemberRole, removeMember } = useOrg();
  const { canManageOrg } = usePermission();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [copied, setCopied] = useState(false);

  const [editName, setEditName] = useState(organization?.name || '');
  const [editColor, setEditColor] = useState(organization?.icon_color || PRESET_COLORS[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const copyCode = () => {
    if (organization) {
      navigator.clipboard.writeText(organization.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError('');

    const result = await updateOrg({
      name: editName,
      icon_color: editColor,
    });

    if (!result.success) {
      setError(result.error || 'Failed to update organization');
    }

    setSaving(false);
  };

  const handlePromote = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'member' ? 'admin' : 'member';
    await updateMemberRole(memberId, newRole);
  };

  const handleRemove = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      await removeMember(memberId);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-400" />;
      case 'admin':
        return <ShieldIcon className="w-4 h-4 text-blue-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
      admin: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
      member: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs border ${colors[role as keyof typeof colors] || colors.member}`}>
        {role}
      </span>
    );
  };

  if (!organization) {
    return (
      <div className="p-8 text-center text-slate-400">
        No organization found. Please contact support.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700 overflow-hidden">
        <div className="border-b border-slate-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-4 font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <Building2 className="w-4 h-4 inline-block mr-2" />
              Overview
            </button>
            {canManageOrg() && (
              <button
                onClick={() => setActiveTab('manage')}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === 'manage'
                    ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                }`}
              >
                <Settings className="w-4 h-4 inline-block mr-2" />
                Manage
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Organization Details</h3>
                <div className="grid gap-4">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">Organization Code</div>
                        <div className="text-2xl font-mono font-bold text-white tracking-widest">
                          {organization.code}
                        </div>
                      </div>
                      <button
                        onClick={copyCode}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" />
                        {copied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-1">Organization Name</div>
                    <div className="text-xl font-semibold text-white">{organization.name}</div>
                  </div>

                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-2">Organization Color</div>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-lg border-2 border-slate-600"
                        style={{ backgroundColor: organization.icon_color }}
                      />
                      <div className="font-mono text-slate-300">{organization.icon_color}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Members ({members.length})
                </h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <div className="font-medium text-white">{member.display_name || 'Unknown'}</div>
                          <div className="text-sm text-slate-400">{member.email}</div>
                        </div>
                      </div>
                      {getRoleBadge(member.role)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'manage' && canManageOrg() && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Organization Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Organization Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Icon Color</label>
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => setEditColor(color.value)}
                          className={`w-full aspect-square rounded-lg transition-all min-h-[48px] ${
                            editColor === color.value
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Manage Members</h3>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {getRoleIcon(member.role)}
                        <div>
                          <div className="font-medium text-white">{member.display_name || 'Unknown'}</div>
                          <div className="text-sm text-slate-400">{member.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRoleBadge(member.role)}
                        {member.role !== 'owner' && (
                          <>
                            <button
                              onClick={() => handlePromote(member.id, member.role)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
                            >
                              {member.role === 'admin' ? 'Demote' : 'Promote'}
                            </button>
                            <button
                              onClick={() => handleRemove(member.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm font-medium transition-colors"
                            >
                              Remove
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
