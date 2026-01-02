import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  Clock,
  LayoutDashboard,
  KanbanSquare,
  CalendarRange,
  FolderTree,
  Link2,
  Search,
  Plus,
  X,
  Settings,
  CheckCircle2,
} from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { supabase } from '../lib/supabase';

type Tab = 'overview' | 'board' | 'planner' | 'files' | 'resources';
type ProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'archived';

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
};

function clampStatus(status: string): ProjectStatus {
  const s = (status || '').toLowerCase();
  if (s === 'planning' || s === 'active' || s === 'review' || s === 'completed' || s === 'archived') return s;
  return 'active';
}

function formatRelative(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString();
}

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function statusPillClass(s: ProjectStatus) {
  switch (s) {
    case 'planning':
      return 'bg-sky-500/15 text-sky-200 border-sky-500/25';
    case 'active':
      return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/25';
    case 'review':
      return 'bg-amber-500/15 text-amber-100 border-amber-500/25';
    case 'completed':
      return 'bg-indigo-500/15 text-indigo-200 border-indigo-500/25';
    case 'archived':
    default:
      return 'bg-slate-500/15 text-slate-200 border-slate-500/25';
  }
}

function stopIfEditableTarget(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

type QCType = 'note' | 'task' | 'link';

export default function ProjectDashboard({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [branchOpen, setBranchOpen] = useState(true);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Project-level search (top-right)
  const [search, setSearch] = useState('');

  // Project settings card (in left nav)
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Editable project fields
  const [nameDraft, setNameDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>('active');

  // Quick capture
  const [qcOpen, setQcOpen] = useState(false);
  const [qcType, setQcType] = useState<QCType | null>(null);
  const [qcText, setQcText] = useState('');
  const qcInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Global keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K reserved later for command palette/search expansions (avoid browser focus)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        if (stopIfEditableTarget(e)) return;
        e.preventDefault();
        // For now: focus the project search
        const el = document.getElementById('project-search') as HTMLInputElement | null;
        el?.focus();
      }

      if (e.key === 'Escape') {
        setQcOpen(false);
        setQcType(null);
        setSettingsOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  async function loadProject() {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!error && data) {
      const p = data as Project;
      setProject(p);
      setNameDraft(p.name || '');
      setDescDraft(p.description || '');
      setStatusDraft(clampStatus(p.status));
    } else {
      setProject(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Show branch panel only for certain tabs (you can change this anytime)
  useEffect(() => {
    if (tab === 'files' || tab === 'resources') setBranchOpen(true);
    else setBranchOpen(false);
  }, [tab]);

  async function saveProjectPatch(patch: Partial<Project>) {
    if (!project) return;
    const { data, error } = await supabase.from('projects').update(patch).eq('id', project.id).select('*').single();
    if (!error && data) {
      const updated = data as Project;
      setProject(updated);
    }
  }

  async function onSaveSettings() {
    if (!project) return;
    await saveProjectPatch({
      name: nameDraft.trim(),
      description: descDraft.trim(),
      status: statusDraft,
    });
    setSettingsOpen(false);
  }

  // Quick capture behavior (autosave as you type placeholder)
  // For now: we keep it UI-only until we decide storage tables (notes/tasks/files).
  useEffect(() => {
    if (!qcOpen) return;
    if (!qcType) return;
    // autosave hook placeholder (no DB yet)
  }, [qcOpen, qcType, qcText]);

  const tabs = useMemo(
    () => [
      { id: 'overview' as const, label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
      { id: 'board' as const, label: 'Board', icon: <KanbanSquare className="w-5 h-5" /> },
      { id: 'planner' as const, label: 'Planner', icon: <CalendarRange className="w-5 h-5" /> },
      { id: 'files' as const, label: 'Files', icon: <FolderTree className="w-5 h-5" /> },
      { id: 'resources' as const, label: 'Resources', icon: <Link2 className="w-5 h-5" /> },
    ],
    []
  );

  const headerTitle = project?.name || 'Project';
  const status = project ? clampStatus(project.status) : 'active';

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="border-b border-slate-800/50 bg-slate-950/75 backdrop-blur">
          <div className="px-8 py-5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateTo('/projects')}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/45 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Projects</span>
              </button>

              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-tight">{headerTitle}</div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-2xl border text-xs ${statusPillClass(status)}`}>{status}</span>
                  {project && (
                    <span className="text-xs text-slate-400 inline-flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Updated {formatRelative(project.updated_at || project.created_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Project global search */}
            <div className="hidden md:flex items-center gap-3 w-[560px] max-w-[45vw] px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/30">
              <Search className="w-5 h-5 text-slate-300" />
              <input
                id="project-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search within this project…"
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <span className="text-xs text-slate-400 border border-slate-700/70 rounded-lg px-2 py-1">Ctrl K</span>
            </div>

            <div className="w-[160px]" />
          </div>
        </header>

        {/* Main split: left nav + (optional) branch + content */}
        <div className="flex-1 flex">
          {/* Left navigation */}
          <aside className="w-72 border-r border-slate-800/50 bg-slate-950/40 backdrop-blur">
            <div className="p-5 space-y-3">
              <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-4">
                <div className="text-sm text-slate-300">Project</div>
                <div className="mt-1 font-semibold truncate">{project?.name || 'Loading…'}</div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/45 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                </div>
              </div>

              <div className="pt-2">
                {tabs.map((t) => {
                  const active = tab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-colors ${
                        active
                          ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                          : 'hover:bg-slate-800/40 text-slate-200'
                      }`}
                    >
                      {t.icon}
                      <span className="text-base font-medium">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Branch panel (collapsible) */}
          {branchOpen && (
            <aside className="w-80 border-r border-slate-800/50 bg-slate-950/30 backdrop-blur">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">Navigator</div>
                  <button
                    onClick={() => setBranchOpen(false)}
                    className="p-2 rounded-2xl border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/40"
                    aria-label="Close branch panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 rounded-3xl border border-slate-800/60 bg-slate-950/25 p-4">
                  {tab === 'files' ? (
                    <div className="space-y-2 text-sm">
                      <div className="text-slate-200 font-medium">Folders</div>
                      <div className="text-slate-400">Project Root</div>
                      <div className="pl-3 text-slate-400">Planning</div>
                      <div className="pl-3 text-slate-400">Research</div>
                      <div className="pl-3 text-slate-400">Ideas</div>
                      <div className="pl-3 text-slate-400">Meeting Notes</div>
                    </div>
                  ) : tab === 'resources' ? (
                    <div className="space-y-2 text-sm">
                      <div className="text-slate-200 font-medium">Categories</div>
                      <div className="text-slate-400">References</div>
                      <div className="text-slate-400">Tools</div>
                      <div className="text-slate-400">Inspiration</div>
                      <div className="text-slate-400">Files</div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">No navigator for this tab.</div>
                  )}
                </div>

                {!branchOpen && (
                  <button
                    onClick={() => setBranchOpen(true)}
                    className="mt-4 w-full px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/20 hover:bg-slate-900/40"
                  >
                    Open Navigator
                  </button>
                )}
              </div>
            </aside>
          )}

          {/* Content */}
          <main className="flex-1 p-8">
            {loading ? (
              <div className="text-slate-300">Loading project…</div>
            ) : !project ? (
              <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
                <div className="text-lg font-semibold">Project not found</div>
                <div className="mt-2 text-slate-300">This project ID doesn’t exist (or you don’t have access).</div>
                <button
                  onClick={() => navigateTo('/projects')}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/45"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to Projects
                </button>
              </div>
            ) : (
              <>
                {tab === 'overview' && <OverviewTab project={project} />}
                {tab === 'board' && <PlaceholderTab title="Board" desc="Kanban will live here next." />}
                {tab === 'planner' && <PlaceholderTab title="Planner" desc="Manual + AI plan flow will live here next." />}
                {tab === 'files' && <PlaceholderTab title="Files" desc="File tree + rich editor will live here next." />}
                {tab === 'resources' && <PlaceholderTab title="Resources" desc="Saved links + categories will live here next." />}
              </>
            )}
          </main>
        </div>

        {/* Settings modal */}
        {settingsOpen && project && (
          <Modal
            title="Project Settings"
            subtitle="Edit project details"
            onClose={() => setSettingsOpen(false)}
            widthClass="w-[860px] max-w-[92vw]"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-300 mb-2">Name</div>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  placeholder="Project name"
                />
              </div>

              <div>
                <div className="text-sm text-slate-300 mb-2">Status</div>
                <Select<ProjectStatus>
                  value={statusDraft}
                  onChange={setStatusDraft}
                  options={[
                    { value: 'planning', label: 'Planning' },
                    { value: 'active', label: 'Active' },
                    { value: 'review', label: 'Review' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-slate-300 mb-2">Description</div>
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                placeholder="Optional: what is this project about?"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-3 rounded-2xl border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45"
              >
                Cancel
              </button>
              <button
                onClick={onSaveSettings}
                className="px-4 py-3 rounded-2xl border bg-blue-500/20 border-blue-500/30 text-blue-200 hover:bg-blue-500/25"
              >
                Save
              </button>
            </div>
          </Modal>
        )}

        {/* Quick capture FAB */}
        <div className="fixed bottom-7 right-7 z-50">
          {qcOpen && (
            <div className="mb-3 w-56 rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur shadow-2xl overflow-hidden">
              <button
                onClick={() => {
                  setQcType('note');
                  setQcText('');
                  window.setTimeout(() => qcInputRef.current?.focus(), 0);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-900/55"
              >
                Quick Note
              </button>
              <button
                onClick={() => {
                  setQcType('task');
                  setQcText('');
                  window.setTimeout(() => qcInputRef.current?.focus(), 0);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-900/55"
              >
                Quick Task
              </button>
              <button
                onClick={() => {
                  setQcType('link');
                  setQcText('');
                  window.setTimeout(() => qcInputRef.current?.focus(), 0);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-900/55"
              >
                Quick Link
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setQcOpen((v) => !v);
              setQcType(null);
              setQcText('');
            }}
            className="h-14 w-14 rounded-2xl border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/25 shadow-2xl flex items-center justify-center"
            aria-label="Quick capture"
          >
            <Plus className="w-6 h-6 text-blue-200" />
          </button>
        </div>

        {/* Quick capture editor */}
        {qcType && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-6">
            <button
              className="absolute inset-0 bg-black/55"
              onClick={() => {
                setQcType(null);
                setQcOpen(false);
              }}
              aria-label="Close"
            />
            <div className="relative w-[860px] max-w-[92vw] rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">
                    {qcType === 'note' ? 'Quick Note' : qcType === 'task' ? 'Quick Task' : 'Quick Link'}
                  </div>
                  <div className="mt-1 text-slate-300 text-sm">
                    Pick a destination next (Files/Board/Planner) once those are wired.
                  </div>
                </div>
                <button
                  onClick={() => {
                    setQcType(null);
                    setQcOpen(false);
                  }}
                  className="p-2 rounded-2xl border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-5">
                <textarea
                  ref={qcInputRef}
                  value={qcText}
                  onChange={(e) => setQcText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
                  placeholder="Type…"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setQcType(null);
                    setQcOpen(false);
                  }}
                  className="px-4 py-3 rounded-2xl border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setQcType(null);
                    setQcOpen(false);
                  }}
                  className="px-4 py-3 rounded-2xl border bg-blue-500/20 border-blue-500/30 text-blue-200 hover:bg-blue-500/25 inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------- Tabs ------------------------- */

function OverviewTab({ project }: { project: Project }) {
  const st = clampStatus(project.status);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-2xl font-semibold truncate">{project.name}</div>
            {project.description?.trim() ? (
              <div className="mt-2 text-slate-300">{project.description}</div>
            ) : (
              <div className="mt-2 text-slate-500">No description</div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {(project.tags || []).slice(0, 8).map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-2xl text-xs bg-slate-900/35 border border-slate-800/60 text-slate-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className={`shrink-0 px-3 py-1 rounded-2xl border text-xs ${statusPillClass(st)}`}>{st}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <StatCard title="Tasks" value="—" subtitle="Board will calculate this" />
        <StatCard title="Plan Progress" value="—" subtitle="Planner will calculate this" />
        <StatCard title="Last Updated" value={formatRelative(project.updated_at || project.created_at)} subtitle="Auto" />
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
        <div className="text-lg font-semibold">Pinned</div>
        <div className="mt-2 text-slate-400">Pinned notes/tasks will live here next.</div>
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
        <div className="text-lg font-semibold">Recent Activity</div>
        <div className="mt-2 text-slate-400">Activity feed will live here next.</div>
      </div>
    </div>
  );
}

function PlaceholderTab({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
      <div className="text-xl font-semibold">{title}</div>
      <div className="mt-2 text-slate-300">{desc}</div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
      <div className="text-sm text-slate-300">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      <div className="mt-2 text-sm text-slate-400">{subtitle}</div>
    </div>
  );
}

/* ------------------------- Modal + Select ------------------------- */

function Modal({
  title,
  subtitle,
  onClose,
  children,
  widthClass = 'w-[760px] max-w-[92vw]',
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  widthClass?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <button className="absolute inset-0 bg-black/55" onClick={onClose} aria-label="Close" />
      <div className={`relative ${widthClass} rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur p-6 shadow-2xl`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xl font-semibold">{title}</div>
            {subtitle ? <div className="mt-1 text-slate-300">{subtitle}</div> : null}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (wrapRef.current && !wrapRef.current.contains(t)) setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  const label = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-950/20 hover:bg-slate-900/35"
      >
        <span className="text-slate-200">{label}</span>
        <ChevronDown className="w-4 h-4 text-slate-400" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-slate-800/60 bg-slate-950/95 backdrop-blur shadow-xl overflow-hidden z-20">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  active ? 'bg-slate-900/65 text-white' : 'text-slate-200 hover:bg-slate-900/45'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
