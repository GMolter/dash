import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { user, org, reloadOrg } = useAuth();

  const [showVerify, setShowVerify] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const isOwner = org?.owner_id === user.id;
  const orgName = org?.name || '';

  const nameMatches = confirmName.trim() === orgName;
  const canConfirm = isOwner
    ? nameMatches && confirmChecked
    : nameMatches;

  const resetModal = () => {
    setConfirmName('');
    setConfirmChecked(false);
    setError(null);
    setBusy(false);
  };

  const closeModal = () => {
    resetModal();
    setShowVerify(false);
  };

  const onConfirm = async () => {
    if (!org) return;
    setBusy(true);
    setError(null);

    try {
      if (isOwner) {
        // OWNER: delete organization (members auto-removed via FK on profiles)
        const { error: delErr } = await supabase
          .from('organizations')
          .delete()
          .eq('id', org.id);

        if (delErr) throw delErr;
      } else {
        // MEMBER: leave org
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ org_id: null })
          .eq('id', user.id);

        if (updErr) throw updErr;
      }

      await reloadOrg();
      closeModal();
    } catch (e: any) {
      setError(String(e?.message || e));
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        onClick={onBack}
        className="text-slate-300 hover:text-white flex items-center gap-2"
      >
        ← Back
      </button>

      <h2 className="mt-6 text-3xl font-semibold text-indigo-300">
        Settings
      </h2>

      <div className="mt-6 space-y-6">
        {/* Account */}
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
          <div className="text-sm text-slate-400">Account</div>
          <div className="mt-1 text-slate-100 break-all">
            {user.email}
          </div>
        </div>

        {/* Organization */}
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
          <div className="text-sm text-slate-400">Organization</div>

          {org ? (
            <>
              <div className="mt-1 text-slate-100">{org.name}</div>

              <button
                onClick={() => setShowVerify(true)}
                className={`mt-5 px-5 py-3 rounded-2xl border transition-colors ${
                  isOwner
                    ? 'border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-200'
                    : 'border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-200'
                }`}
              >
                {isOwner ? 'Delete Organization' : 'Leave Organization'}
              </button>
            </>
          ) : (
            <div className="mt-1 text-slate-400">
              You are not in an organization.
            </div>
          )}
        </div>
      </div>

      {/* VERIFY MODAL */}
      {showVerify && org && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={closeModal}
          />

          <div className="relative w-full max-w-lg rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur p-7 shadow-2xl">
            <h3 className="text-2xl font-semibold text-red-300">
              {isOwner ? 'Delete Organization' : 'Leave Organization'}
            </h3>

            <p className="mt-3 text-slate-300">
              {isOwner ? (
                <>
                  This will <strong>permanently delete</strong> the organization
                  <strong className="text-slate-100"> {org.name}</strong>.
                  <br />
                  <br />
                  All data will be removed and all members will be detached.
                  This action cannot be undone.
                </>
              ) : (
                <>
                  You are about to leave
                  <strong className="text-slate-100"> {org.name}</strong>.
                </>
              )}
            </p>

            {isOwner && (
              <label className="mt-5 flex items-start gap-3 text-slate-300">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  I understand this will permanently delete the organization
                  and remove all members.
                </span>
              </label>
            )}

            <div className="mt-5">
              <label className="block text-sm text-slate-400 mb-2">
                Type <strong>{org.name}</strong> to confirm
              </label>
              <input
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/70 focus:outline-none focus:ring-2 focus:ring-red-500/40"
              />
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100 text-sm">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={busy}
                className="px-4 py-2 rounded-xl hover:bg-slate-800/60 transition-colors text-slate-200"
              >
                Cancel
              </button>

              <button
                onClick={onConfirm}
                disabled={!canConfirm || busy}
                className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors font-medium"
              >
                {busy
                  ? 'Working…'
                  : isOwner
                  ? 'Confirm Deletion'
                  : 'Confirm Leave'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
