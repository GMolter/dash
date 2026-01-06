import { useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

type Mode = 'signin' | 'signup';

export function Onboarding() {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.trim().length >= 6;
  }, [email, password]);

  const onSubmit = async () => {
    setError(null);
    setInfo(null);
    if (!canSubmit) return;

    setBusy(true);
    try {
      if (mode === 'signin') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInErr) throw signInErr;
      } else {
        const { error: signUpErr, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) throw signUpErr;

        // If email confirmations are enabled, Supabase returns a user but no session.
        if (!data.session) {
          setInfo('Check your email to confirm your account, then come back and sign in.');
        }
      }
    } catch (e: any) {
      setError(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      <div className="absolute inset-0 bg-slate-950" />
      <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(99,102,241,0.35),transparent_45%),radial-gradient(circle_at_60%_80%,rgba(14,165,233,0.25),transparent_45%)]" />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-slate-800/60 bg-slate-950/60 backdrop-blur p-7 shadow-2xl">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">Olio</h1>
            <p className="mt-2 text-slate-300">Sign in to your dashboard — or create an account.</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <button
              onClick={() => setMode('signin')}
              className={`px-4 py-3 rounded-2xl border transition-colors ${
                mode === 'signin'
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                  : 'border-slate-800/60 hover:bg-slate-800/40 text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`px-4 py-3 rounded-2xl border transition-colors ${
                mode === 'signup'
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-200'
                  : 'border-slate-800/60 hover:bg-slate-800/40 text-slate-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder="you@domain.com"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-2">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className="w-full px-4 py-3 rounded-2xl bg-slate-900/40 border border-slate-800/70 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-100 text-sm">
                {error}
              </div>
            )}

            {info && (
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-100 text-sm">
                {info}
              </div>
            )}

            <button
              onClick={onSubmit}
              disabled={!canSubmit || busy}
              className="w-full px-4 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 transition-colors font-medium"
            >
              {busy ? 'Working…' : mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </div>

          <p className="mt-6 text-xs text-slate-400 leading-relaxed">
            By continuing, you agree to basic usage of cookies/local storage for session state.
          </p>
        </div>
      </div>
    </div>
  );
}
