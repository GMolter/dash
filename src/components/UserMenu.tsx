import { useEffect, useRef, useState } from 'react';
import { LogOut, Settings, User as UserIcon } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export function UserMenu({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { user, org, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (btnRef.current?.contains(t)) return;
      if (popRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  if (!user) return null;

  const initials = (user.email || 'U').slice(0, 1).toUpperCase();

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-2xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/50 transition-colors flex items-center justify-center"
        aria-label="Open profile menu"
      >
        {org?.icon_color ? (
          <div
            className="h-10 w-10 rounded-xl border border-slate-800/60 flex items-center justify-center font-semibold"
            style={{ backgroundColor: org.icon_color }}
            title={org.name}
          >
            {initials}
          </div>
        ) : (
          <UserIcon className="w-6 h-6 text-slate-200" />
        )}
      </button>

      {open && (
        <div
          ref={popRef}
          className="absolute right-0 mt-3 w-72 rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur shadow-2xl overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-slate-800/60">
            <div className="text-sm text-slate-300">Signed in as</div>
            <div className="mt-1 font-medium text-slate-100 break-all">{user.email}</div>
            {org?.name && (
              <div className="mt-2 text-xs text-slate-400">
                Org: <span className="text-slate-200">{org.name}</span>
              </div>
            )}
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setOpen(false);
                onOpenSettings();
              }}
              className="w-full px-4 py-3 rounded-2xl hover:bg-slate-800/50 transition-colors flex items-center gap-3 text-slate-200"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>

            <button
              onClick={async () => {
                setOpen(false);
                await signOut();
              }}
              className="w-full px-4 py-3 rounded-2xl hover:bg-red-500/10 transition-colors flex items-center gap-3 text-red-100"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
