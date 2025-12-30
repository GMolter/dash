import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpDown,
  CheckCircle2,
  Clock,
  FolderPlus,
  LayoutGrid,
  Search,
  Sparkles,
} from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { supabase } from '../lib/supabase';

type ProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'archived';

type Project = {
  id: string;
  name: string;
  description: string;
  url?: string | null;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type Filter = 'all' | 'active' | 'completed' | 'archived';
type Sort = 'recent' | 'name' | 'status';

function clampStatus(status: string): ProjectStatus {
  const s = (status || '').toLowerCase();
  if (s === 'planning' || s === 'active' || s === 'review' || s === 'completed' || s === 'archived') return s;
  return 'active';
}

function statusPill(status: ProjectStatus) {
  switch (status) {
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

function stopIfEditableTarget(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

export function ProjectsCenterApp({
  onOpenProject,
}: {
  onOpenProject: (id: string) => void;
}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('recent');

  const [templateOpen, setTemplateOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [ctrlHintOpen, setCtrlHintOpen] = useState(false);
  const ctrlHoldTimer = useRef<number | null>(null);

  const commandInputRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data) setProjects(data as Project[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Ctrl+K command palette + Ctrl-hold shortcut hints
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        if (ctrlHoldTimer.current) window.clearTimeout(ctrlHoldTimer.current);
        ctrlHoldTimer.current = window.setTimeout(() => setCtrlHintOpen(true), 550);
      }

      if (stopIfEditableTarget(e)) return;

      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCommandOpen(true);
        setCtrlHintOpen(false);
        window.setTimeout(() => commandInputRef.current?.focus(), 0);
      }

      if (e.key === 'Escape') {
        setCommandOpen(false);
        setTemplateOpen(false);
        setCtrlHintOpen(false);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Control') {
        if (ctrlHoldTimer.current) window.clearTimeout(ctrlHoldTimer.current);
        ctrlHoldTimer.current = null;
        setCtrlHintOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!commandOpen) setCommandQuery('');
  }, [commandOpen]);

  const visibleProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects;

    if (filter !== 'all') {
      list = list.filter((p) => {
        const s = clampStatus(p.status);
        if (filter === 'active') return s === 'planning' || s === 'active' || s === 'review';
        if (filter === 'completed') return s === 'completed';
        if (filter === 'archived') return s === 'archived';
        return true;
      });
    }

    if (q) {
      list = list.filter((p) => {
        const hay = `${p.name} ${p.description} ${(p.tags || []).join(' ')}`.toLowerCase();
        return hay.includes(q);
      });
    }

    const sorted = [...list];
    if (sort === 'recent') {
      sorted.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sort === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'status') {
      sorted.sort((a, b) => clampStatus(a.status).localeCompare(clampStatus(b.status)));
    }

    return sorted;
  }, [projects, query, filter, sort]);

  async function createProject(template: 'blank' | 'personal' | 'school') {
    const baseName =
      template === 'blank' ? 'New Project' : template === 'personal' ? 'New Personal Project' : 'New School Project';

    const tagSeed = template === 'blank' ? [] : template === 'personal' ? ['personal'] : ['school'];

    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: baseName,
        description: '',
        status: 'planning',
        tags: tagSeed,
      })
      .select('*')
      .single();

    if (!error && data) {
      await load();
      setTemplateOpen(false);
      onOpenProject((data as Project).id);
    }
  }

  const commandItems = useMemo(() => {
    const q = commandQuery.trim().toLowerCase();

    const actions = [
      {
        id: 'new-project',
        label: 'Create new project…',
        hint: 'Templates',
        onRun: () => {
          setCommandOpen(false);
          setTemplateOpen(true);
        },
      },
      {
        id: 'filter-all',
        label: 'Filter: All projects',
        hint: 'View',
        onRun: () => {
          setFilter('all');
          setCommandOpen(false);
        },
      },
      {
        id: 'filter-active',
        label: 'Filter: Active projects',
        hint: 'View',
        onRun: () => {
          setFilter('active');
          setCommandOpen(false);
        },
      },
      {
        id: 'filter-completed',
        label: 'Filter: Completed projects',
        hint: 'View',
        onRun: () => {
          setFilter('completed');
          setCommandOpen(false);
        },
      },
      {
        id: 'filter-archived',
        label: 'Filter: Archived projects',
        hint: 'View',
        onRun: () => {
          setFilter('archived');
          setCommandOpen(false);
        },
      },
    ];

    const jump = projects.slice(0, 50).map((p) => ({
      id: `open-${p.id}`,
      label: `Open: ${p.name}`,
      hint: 'Project',
      onRun: () => {
        setCommandOpen(false);
        onOpenProject(p.id);
      },
    }));

    const all = [...actions, ...jump];
    if (!q) return all;
    return all.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q));
  }, [commandQuery, onOpenProject, projects]);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="border-b border-slate-800/50 bg-slate-950/75 backdrop-blur">
          <div className="px-8 py-5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400" />
              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-tight">Olio</div>
                <div className="text-sm text-slate-300">Projects Center</div>
              </div>
            </div>

            {/* Global search (Ctrl+K) */}
            <button
              onClick={() => {
                setCommandOpen(true);
                window.setTimeout(() => commandInputRef.current?.focus(), 0);
              }}
              className="hidden md:flex items-center gap-3 w-[560px] max-w-[45vw] px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/30 hover:bg-slate-900/45 transition-colors"
            >
              <Search className="w-5 h-5 text-slate-300" />
              <span className="text-slate-300">Search projects, actions, content…</span>
              <span className="ml-auto text-xs text-slate-400 border border-slate-700/70 rounded-lg px-2 py-1">
                Ctrl K
              </span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setTemplateOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-200 hover:bg-blue-500/25 transition-colors"
              >
                <FolderPlus className="w-5 h-5" />
                <span className="font-medium">New Project</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-8 py-8">
          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
            <div className="flex-1 flex items-center gap-3">
              <div className="relative flex-1 max-w-[680px]">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search projects…"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="flex items-center gap-2">
                {(['all', 'active', 'completed', 'archived'] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-2 rounded-2xl border text-sm transition-colors ${
                      filter === f
                        ? 'bg-slate-800/60 border-slate-700 text-white'
                        : 'bg-slate-950/20 border-slate-800/60 text-slate-300 hover:bg-slate-900/35'
                    }`}
                  >
                    {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-950/20">
                <ArrowUpDown className="w-4 h-4 text-slate-300" />
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as Sort)}
                  className="bg-transparent text-slate-200 focus:outline-none"
                >
                  <option value="recent">Sort: Recent</option>
                  <option value="name">Sort: Name</option>
                  <option value="status">Sort: Status</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            <button
              onClick={() => setTemplateOpen(true)}
              className="group rounded-3xl border border-slate-800/60 bg-slate-950/20 hover:bg-slate-900/35 transition-colors p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                  <FolderPlus className="w-6 h-6 text-blue-200" />
                </div>
                <div>
                  <div className="text-base font-semibold">Create a project</div>
                  <div className="text-sm text-slate-300">Blank, personal, or school templates</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-400">Pick a template and start planning instantly.</div>
            </button>

            {loading ? (
              <div className="col-span-full text-slate-300">Loading projects…</div>
            ) : visibleProjects.length === 0 ? (
              <div className="col-span-full text-slate-300">No projects found.</div>
            ) : (
              visibleProjects.map((p) => {
                const st = clampStatus(p.status);
                const progress = 0; // (dashboard will calculate later)
                return (
                  <button
                    key={p.id}
                    onClick={() => onOpenProject(p.id)}
                    className="group rounded-3xl border border-slate-800/60 bg-slate-950/20 hover:bg-slate-900/35 transition-colors p-5 text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-semibold truncate">{p.name}</div>
                        {p.description?.trim() ? (
                          <div className="mt-1 text-sm text-slate-300 line-clamp-2">{p.description}</div>
                        ) : (
                          <div className="mt-1 text-sm text-slate-500">No description</div>
                        )}
                      </div>
                      <div className={`shrink-0 px-3 py-1 rounded-2xl border text-xs ${statusPill(st)}`}>{st}</div>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-sm">
                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/30 border border-slate-800/60">
                        <LayoutGrid className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-200">Progress</span>
                        <span className="ml-1 font-mono text-slate-100">{progress}%</span>
                      </div>

                      <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-900/30 border border-slate-800/60">
                        <Clock className="w-4 h-4 text-slate-300" />
                        <span className="text-slate-200">Updated</span>
                        <span className="ml-1 text-slate-100">{formatRelative(p.updated_at || p.created_at)}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {(p.tags || []).slice(0, 4).map((t) => (
                        <span
                          key={t}
                          className="px-3 py-1 rounded-2xl text-xs bg-slate-900/35 border border-slate-800/60 text-slate-200"
                        >
                          {t}
                        </span>
                      ))}
                      {(p.tags || []).length > 4 && (
                        <span className="px-3 py-1 rounded-2xl text-xs bg-slate-900/35 border border-slate-800/60 text-slate-300">
                          +{(p.tags || []).length - 4}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* Ctrl-hold hints */}
      {ctrlHintOpen && (
        <div className="fixed inset-0 z-40 pointer-events-none flex items-start justify-center pt-24">
          <div className="pointer-events-auto w-[520px] max-w-[90vw] rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur p-5 shadow-2xl">
            <div className="text-sm text-slate-300">Keyboard shortcuts</div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Search / Command palette</span>
                <span className="font-mono text-slate-100 border border-slate-700/70 rounded-lg px-2 py-1">Ctrl K</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">New project</span>
                <span className="font-mono text-slate-100 border border-slate-700/70 rounded-lg px-2 py-1">Ctrl N</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200">Close modals</span>
                <span className="font-mono text-slate-100 border border-slate-700/70 rounded-lg px-2 py-1">Esc</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Template selector */}
      {templateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <button className="absolute inset-0 bg-black/55" onClick={() => setTemplateOpen(false)} aria-label="Close" />
          <div className="relative w-[760px] max-w-[92vw] rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xl font-semibold">Create a project</div>
                <div className="mt-1 text-slate-300">Pick a template to start with.</div>
              </div>
              <button
                onClick={() => setTemplateOpen(false)}
                className="px-3 py-2 rounded-2xl border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => createProject('blank')}
                className="rounded-3xl border border-slate-800/60 bg-slate-950/25 hover:bg-slate-900/40 transition-colors p-5 text-left"
              >
                <div className="h-11 w-11 rounded-2xl border border-slate-800/60 bg-slate-900/25 flex items-center justify-center">
                  <LayoutGrid className="w-5 h-5 text-slate-200" />
                </div>
                <div className="mt-4 font-semibold">Blank Project</div>
                <div className="mt-1 text-sm text-slate-300">Minimal structure. Build your own workflow.</div>
              </button>

              <button
                onClick={() => createProject('personal')}
                className="rounded-3xl border border-slate-800/60 bg-slate-950/25 hover:bg-slate-900/40 transition-colors p-5 text-left"
              >
                <div className="h-11 w-11 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                </div>
                <div className="mt-4 font-semibold">Personal Project</div>
                <div className="mt-1 text-sm text-slate-300">Goals, inspiration, resources—ready to go.</div>
              </button>

              <button
                onClick={() => createProject('school')}
                className="rounded-3xl border border-slate-800/60 bg-slate-950/25 hover:bg-slate-900/40 transition-colors p-5 text-left"
              >
                <div className="h-11 w-11 rounded-2xl border border-indigo-500/25 bg-indigo-500/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-indigo-200" />
                </div>
                <div className="mt-4 font-semibold">School Project</div>
                <div className="mt-1 text-sm text-slate-300">Planning folder, rubric, and submission tracking.</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Command palette */}
      {commandOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6 pt-24">
          <button className="absolute inset-0 bg-black/55" onClick={() => setCommandOpen(false)} aria-label="Close" />
          <div className="relative w-[720px] max-w-[92vw] rounded-3xl border border-slate-800/60 bg-slate-950/92 backdrop-blur shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800/60 flex items-center gap-3">
              <Search className="w-5 h-5 text-slate-300" />
              <input
                ref={commandInputRef}
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Search actions and projects…"
                className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              <span className="text-xs text-slate-400 border border-slate-700/70 rounded-lg px-2 py-1">Esc</span>
            </div>

            <div className="max-h-[520px] overflow-auto p-2">
              {commandItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onRun}
                  className="w-full text-left px-4 py-3 rounded-2xl hover:bg-slate-900/45 transition-colors flex items-center justify-between gap-4"
                >
                  <span className="text-slate-100">{item.label}</span>
                  <span className="text-xs text-slate-400">{item.hint}</span>
                </button>
              ))}
              {commandItems.length === 0 && <div className="px-4 py-6 text-slate-300">No results.</div>}
            </div>
          </div>
        </div>
      )}

      <GlobalHotkeys
        onNewProject={() => setTemplateOpen(true)}
        onClose={() => {
          setCommandOpen(false);
          setTemplateOpen(false);
        }}
      />
    </div>
  );
}

function GlobalHotkeys({
  onNewProject,
  onClose,
}: {
  onNewProject: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (stopIfEditableTarget(e)) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault();
        onNewProject();
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, onNewProject]);

  return null;
}
