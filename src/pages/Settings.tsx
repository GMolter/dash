import { useAuth } from '../auth/AuthContext';

export function SettingsPage({ onBack }: { onBack: () => void }) {
  const { user, org } = useAuth();

  return (
    <div className="max-w-3xl">
      <button
        onClick={onBack}
        className="text-slate-300 hover:text-white flex items-center gap-2"
      >
        ← Back
      </button>

      <h2 className="mt-6 text-3xl font-semibold text-indigo-300">Settings</h2>
      <p className="mt-2 text-slate-300">
        This page is a placeholder for the first iteration.
      </p>

      <div className="mt-6 rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6 space-y-3">
        <div>
          <div className="text-sm text-slate-400">Account</div>
          <div className="text-slate-100 break-all">{user?.email || '—'}</div>
        </div>
        <div>
          <div className="text-sm text-slate-400">Organization</div>
          <div className="text-slate-100">{org?.name || 'No org yet'}</div>
        </div>
      </div>
    </div>
  );
}
