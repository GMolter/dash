import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../lib/supabase';

type OrgMember = {
  id: string;
  email?: string | null;
  org_id?: string | null;
};

function formatDateTime(ts?: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function OrganizationPage() {
  const { org } = useAuth();

  const [copied, setCopied] = useState(false);

  // members (read-only)
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);

  // announcements + shared links (read-only placeholders for now)
  const announcements = useMemo(
    () => [
      {
        title: 'Welcome to your org',
        body: 'This space is shared by everyone in your organization.',
      },
    ],
    []
  );

  const sharedLinks = useMemo(
    () => [
      { label: 'Olio Home', url: 'https://olio.one' },
    ],
    []
  );

  useEffect(() => {
    let cancelled = false;

    async function loadMembers() {
      if (!org?.id) return;

      setMembersLoading(true);
      setMembersError(null);

      try {
        // NOTE:
        // This will only succeed if your RLS allows org members to SELECT other profiles in same org.
        // If not, we show a friendly message instead of breaking.
        const { data, error } = await supabase
          .from('profiles')
          .select('id, org_id')
          .eq('org_id', org.id)
          .limit(100);

        if (error) throw error;

        if (!cancelled) {
          setMembers((data as OrgMember[]) ?? []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setMembersError(
            String(e?.message || e) +
              '\n\nMember list requires an RLS policy that allows org members to read profiles in their org.'
          );
          setMembers([]);
        }
      } finally {
        if (!cancelled) setMembersLoading(false);
      }
    }

    loadMembers();

    return () => {
      cancelled = true;
    };
  }, [org?.id]);

  if (!org) return null;

  const memberCountLabel =
    membersError ? '—' : membersLoading ? 'Loading…' : String(members.length || 1);

  return (
    <div className="max-w-5xl space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-semibold text-indigo-300">Organization</h2>
        <p className="mt-2 text-slate-300">
          Shared information for everyone in this organization.
        </p>
      </div>

      {/* ORG CODE (most important) */}
      <div className="rounded-3xl border border-blue-500/30 bg-blue-500/10 backdrop-blur p-7">
        <div className="text-sm uppercase tracking-wide text-blue-200">
          Organization Code
        </div>

        <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="font-mono text-3xl md:text-4xl text-white tracking-wider">
            {org.code ?? '—'}
          </div>

          <button
            onClick={async () => {
              if (!org.code) return;
              await navigator.clipboard.writeText(org.code);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 900);
            }}
            className="px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 transition-colors font-medium"
          >
            {copied ? 'Copied' : 'Copy Code'}
          </button>
        </div>

        <p className="mt-3 text-sm text-blue-100/80">
          Share this code to invite others to your organization.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
          <div className="text-sm text-slate-400">Name</div>
          <div className="mt-1 text-lg text-slate-100">{org.name}</div>
        </div>

        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
          <div className="text-sm text-slate-400">Created</div>
          <div className="mt-1 text-slate-100">{formatDateTime(org.created_at ?? null)}</div>
        </div>

        <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
          <div className="text-sm text-slate-400">Members</div>
          <div className="mt-1 text-2xl font-semibold text-slate-100">
            {memberCountLabel}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Read-only count
          </div>
        </div>
      </div>

      {/* Branding / Icon color */}
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
        <div className="text-sm text-slate-400">Branding</div>
        <div className="mt-3 flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl border border-slate-800/60"
            style={{ backgroundColor: org.icon_color }}
          />
          <span className="font-mono text-slate-300">{org.icon_color}</span>
        </div>
      </div>

      {/* Announcements */}
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-100">Announcements</div>
            <div className="mt-1 text-sm text-slate-400">
              Visible to everyone in the organization.
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Read-only for members
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {announcements.length === 0 ? (
            <div className="text-slate-400">No announcements yet.</div>
          ) : (
            announcements.map((a, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800/60 bg-slate-900/20 p-4"
              >
                <div className="font-medium text-slate-100">{a.title}</div>
                <div className="mt-1 text-slate-300">{a.body}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shared Links / Resources */}
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-100">Shared Links</div>
            <div className="mt-1 text-sm text-slate-400">
              Useful resources everyone in the org can access.
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Read-only for members
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {sharedLinks.length === 0 ? (
            <div className="text-slate-400">No links have been added yet.</div>
          ) : (
            sharedLinks.map((l, idx) => (
              <a
                key={idx}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-slate-800/60 bg-slate-900/20 p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="font-medium text-slate-100">{l.label}</div>
                <div className="mt-1 text-sm text-slate-400 break-all">{l.url}</div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Members list (read-only) */}
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/40 backdrop-blur p-6">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <div className="text-xl font-semibold text-slate-100">Members</div>
            <div className="mt-1 text-sm text-slate-400">
              Everyone currently connected to this organization.
            </div>
          </div>
          <div className="text-xs text-slate-400">
            Read-only
          </div>
        </div>

        <div className="mt-5">
          {membersLoading && <div className="text-slate-400">Loading members…</div>}

          {membersError && (
            <div className="whitespace-pre-wrap rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm">
              {membersError}
            </div>
          )}

          {!membersLoading && !membersError && (
            <div className="space-y-2">
              {(members.length ? members : [{ id: 'you' }]).map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-slate-800/60 bg-slate-900/20 px-4 py-3 text-slate-200"
                >
                  <div className="text-sm">
                    Member ID: <span className="font-mono text-slate-300">{m.id}</span>
                  </div>
                </div>
              ))}
              <div className="mt-3 text-xs text-slate-400">
                Note: showing IDs for now. If you want emails/names, we’ll add a safe profile field (display name) later.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
