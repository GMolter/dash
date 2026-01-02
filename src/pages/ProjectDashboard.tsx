import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Clock,
  FilePlus2,
  FileText,
  FolderPlus,
  FolderTree,
  KanbanSquare,
  LayoutDashboard,
  Link2,
  Plus,
  Search,
  Settings,
  X,
} from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { supabase } from '../lib/supabase';

type ProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'archived';
type Tab = 'overview' | 'board' | 'planner' | 'files' | 'resources';

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

function stopIfEditableTarget(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || el.isContentEditable;
}

/* --------------------------------- Files ---------------------------------- */

type FileNodeType = 'folder' | 'doc';

type FileNode = {
  id: string;
  type: FileNodeType;
  name: string;
  children?: FileNode[];
  content?: string; // docs only
};

function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function findNode(root: FileNode, id: string): FileNode | null {
  if (root.id === id) return root;
  if (root.type === 'folder' && root.children) {
    for (const c of root.children) {
      const got = findNode(c, id);
      if (got) return got;
    }
  }
  return null;
}

function updateDocContent(root: FileNode, id: string, content: string): FileNode {
  if (root.id === id) {
    return root.type === 'doc' ? { ...root, content } : root;
  }
  if (root.type === 'folder') {
    return {
      ...root,
      children: (root.children || []).map((c) => updateDocContent(c, id, content)),
    };
  }
  return root;
}

function addChild(root: FileNode, folderId: string, child: FileNode): FileNode {
  if (root.id === folderId && root.type === 'folder') {
    return { ...root, children: [...(root.children || []), child] };
  }
  if (root.type === 'folder') {
    return { ...root, children: (root.children || []).map((c) => addChild(c, folderId, child)) };
  }
  return root;
}

function flattenDocs(root: FileNode): { id: string; name: string }[] {
  const out: { id: string; name: string }[] = [];
  const walk = (n: FileNode) => {
    if (n.type === 'doc') out.push({ id: n.id, name: n.name });
    if (n.type === 'folder') (n.children || []).forEach(walk);
  };
  walk(root);
  return out;
}

/* ------------------------------- Quick capture ------------------------------ */

type QCType = 'note' | 'task' | 'link';

type ProjectSearchItem =
  | { id: string; kind: 'action'; label: string; hint: string; run: () => void }
  | { id: string; kind: 'file'; label: string; hint: string; run: () => void };

export default function ProjectDashboard({ projectId }: { projectId: string }) {
  const [tab, setTab] = useState<Tab>('overview');
  const [branchOpen, setBranchOpen] = useState(false);

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Project-level search (top bar)
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchIndex, setSearchIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchBoxRef = useRef<HTMLDivElement | null>(null);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Editable project fields
  const [nameDraft, setNameDraft] = useState('');
  const [descDraft, setDescDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<ProjectStatus>('active');

  // Files
  const [fileRoot, setFileRoot] = useState<FileNode>(() => ({
    id: 'root',
    type: 'folder',
    name: 'Project Root',
    children: [
      {
        id: 'planning',
        type: 'folder',
        name: 'Planning',
        children: [
          { id: 'directions', type: 'doc', name: 'Directions/Instructions', content: '' },
          { id: 'rubric', type: 'doc', name: 'Rubric', content: '' },
          { id: 'constraints', type: 'doc', name: 'Constraints/Restrictions', content: '' },
          { id: 'context', type: 'doc', name: 'Additional Context', content: '' },
        ],
      },
      { id: 'research', type: 'folder', name: 'Research', children: [] },
      { id: 'ideas', type: 'folder', name: 'Ideas', children: [] },
      { id: 'meeting', type: 'folder', name: 'Meeting Notes', children: [] },
      { id: 'quick-notes', type: 'doc', name: 'Quick Notes', content: '' },
    ],
  }));
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => ({
    root: true,
    planning: true,
  }));
  const [selectedFileId, setSelectedFileId] = useState<string>('quick-notes');

  const selectedFile = useMemo(() => findNode(fileRoot, selectedFileId), [fileRoot, selectedFileId]);
  const selectedDocContent = selectedFile?.type === 'doc' ? selectedFile.content || '' : '';

  const [docDraft, setDocDraft] = useState<string>(selectedDocContent);
  useEffect(() => {
    setDocDraft(selectedDocContent);
  }, [selectedFileId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Quick capture
  const [qcOpen, setQcOpen] = useState(false);
  const [qcType, setQcType] = useState<QCType | null>(null);
  const [qcText, setQcText] = useState('');
  const qcInputRef = useRef<HTMLTextAreaElement | null>(null);

  // Tabs list
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

  // Branch panel visibility: only Files/Resources use it.
  useEffect(() => {
    if (tab === 'files' || tab === 'resources') setBranchOpen(true);
    else setBranchOpen(false);
  }, [tab]);

  // Save doc content (local-only) as you type (debounced)
  const saveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (tab !== 'files') return;
    if (!selectedFile || selectedFile.type !== 'doc') return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      setFileRoot((r) => updateDocContent(r, selectedFile.id, docDraft));
    }, 250);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    };
  }, [docDraft, selectedFileId, tab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search items (actions + files)
  const searchItems = useMemo<ProjectSearchItem[]>(() => {
    const q = search.trim().toLowerCase();

    const actions: ProjectSearchItem[] = [
      { id: 'go-overview', kind: 'action', label: 'Go to Overview', hint: 'View', run: () => setTab('overview') },
      { id: 'go-board', kind: 'action', label: 'Go to Board', hint: 'View', run: () => setTab('board') },
      { id: 'go-planner', kind: 'action', label: 'Go to Planner', hint: 'View', run: () => setTab('planner') },
      { id: 'go-files', kind: 'action', label: 'Go to Files', hint: 'View', run: () => setTab('files') },
      { id: 'go-resources', kind: 'action', label: 'Go to Resources', hint: 'View', run: () => setTab('resources') },
      { id: 'open-settings', kind: 'action', label: 'Open Project Settings', hint: 'Project', run: () => setSettingsOpen(true) },
    ];

    const files: ProjectSearchItem[] = flattenDocs(fileRoot).map((d) => ({
      id: `file-${d.id}`,
      kind: 'file',
      label: d.name,
      hint: 'File',
      run: () => {
        setTab('files');
        setSelectedFileId(d.id);
        setExpanded((e) => ({ ...e, root: true, planning: true }));
      },
    }));

    const all = [...actions, ...files];
    if (!q) return all;

    return all.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(q));
  }, [search, fileRoot]);

  useEffect(() => {
    if (!searchOpen) return;
    setSearchIndex((i) => Math.min(i, Math.max(0, searchItems.length - 1)));
  }, [searchItems.length, searchOpen]);

  // Close search dropdown on outside click
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (searchBoxRef.current && !searchBoxRef.current.contains(t)) setSearchOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, []);

  // Global keyboard
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K: focus project search and open dropdown
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        if (stopIfEditableTarget(e)) return;
        e.preventDefault();
        setSearchOpen(true);
        setSearchIndex(0);
        window.setTimeout(() => searchInputRef.current?.focus(), 0);
      }

      // Search dropdown navigation (only when focused/open)
      if (searchOpen) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSearchIndex((i) => Math.min(i + 1, Math.max(0, searchItems.length - 1)));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSearchIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
          const isInSearch =
            document.activeElement === searchInputRef.current || (searchBoxRef.current?.contains(document.activeElement) ?? false);
          if (isInSearch) {
            e.preventDefault();
            const item = searchItems[searchIndex];
            if (!item) return;
            item.run();
            setSearchOpen(false);
          }
        }
      }

      if (e.key === 'Escape') {
        setQcOpen(false);
        setQcType(null);
        setSettingsOpen(false);
        setSearchOpen(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [searchOpen, searchIndex, searchItems]);

  async function loadProject() {
    setLoading(true);
    const { data, error } = await supabase.from('projects').select('*').eq('id', projectId).single();
    if (!error && data) {
      const p = data as Project;
      setProject(p);
      setNameDraft(p.name || '');
      setDescDraft(p.description || '');
      setStatusDraft(clampStatus(p.status));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadProject();
  }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveProjectSettings() {
    if (!project) return;
    const payload = {
      name: nameDraft.trim(),
      description: descDraft.trim(),
      status: statusDraft,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('projects').update(payload).eq('id', project.id);
    if (!error) {
      await loadProject();
      setSettingsOpen(false);
    }
  }

  function onTabClick(next: Tab) {
    if (next === tab && (next === 'files' || next === 'resources')) {
      setBranchOpen(true);
      return;
    }
    setTab(next);
  }

  function toggleExpanded(id: string) {
    setExpanded((e) => ({ ...e, [id]: !e[id] }));
  }

  function handleNewFolder(parentId: string) {
    const name = prompt('Folder name')?.trim();
    if (!name) return;
    setFileRoot((r) => addChild(r, parentId, { id: uid('folder'), type: 'folder', name, children: [] }));
    setExpanded((e) => ({ ...e, [parentId]: true }));
  }

  function handleNewDoc(parentId: string) {
    const name = prompt('Document name')?.trim();
    if (!name) return;
    const id = uid('doc');
    setFileRoot((r) => addChild(r, parentId, { id, type: 'doc', name, content: '' }));
    setExpanded((e) => ({ ...e, [parentId]: true }));
    setSelectedFileId(id);
  }

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar */}
        <header className="border-b border-slate-800/50 bg-slate-950/75 backdrop-blur">
          <div className="px-8 py-5 flex items-center justify-between gap-6">
            <div className="flex items-center gap-4 min-w-0">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/45 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Projects</span>
              </button>

              <div className="min-w-0">
                <div className="text-lg font-semibold tracking-tight truncate">{headerTitle}</div>
                <div className="mt-1 flex items-center gap-3 text-sm text-slate-300">
                  <span className={`px-3 py-1 rounded-2xl border text-xs ${statusPill(status)}`}>{status}</span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400" />
                    Updated {project ? formatRelative(project.updated_at || project.created_at) : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Project global search */}
            <div ref={searchBoxRef} className="hidden md:block w-[640px] max-w-[48vw] relative">
              <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/30">
                <Search className="w-5 h-5 text-slate-300" />
                <input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSearchOpen(true);
                    setSearchIndex(0);
                  }}
                  onFocus={() => {
                    setSearchOpen(true);
                    setSearchIndex(0);
                  }}
                  id="project-search"
                  placeholder="Search within this project…"
                  className="w-full bg-transparent text-slate-100 placeholder-slate-400 focus:outline-none"
                />
                <span className="text-xs text-slate-400 border border-slate-700/70 rounded-lg px-2 py-1">Ctrl K</span>
              </div>

              {searchOpen && (
                <div className="absolute left-0 right-0 mt-3 rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur shadow-2xl overflow-hidden z-40">
                  <div className="max-h-[420px] overflow-auto p-2">
                    {searchItems.slice(0, 40).map((item, idx) => {
                      const selected = idx === searchIndex;
                      return (
                        <button
                          key={item.id}
                          onMouseEnter={() => setSearchIndex(idx)}
                          onClick={() => {
                            item.run();
                            setSearchOpen(false);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-2xl transition-colors flex items-center justify-between gap-4 ${
                            selected ? 'bg-slate-900/55' : 'hover:bg-slate-900/45'
                          }`}
                        >
                          <span className="text-slate-100 truncate">{item.label}</span>
                          <span className="text-xs text-slate-400 shrink-0">{item.hint}</span>
                        </button>
                      );
                    })}
                    {searchItems.length === 0 && <div className="px-4 py-6 text-slate-300">No results.</div>}
                  </div>
                  <div className="px-4 py-3 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
                    <span>Use ↑ ↓ then Enter</span>
                    <button
                      onClick={() => setSearchOpen(false)}
                      className="px-2 py-1 rounded-lg border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setSettingsOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/45 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-200" />
                <span className="font-medium hidden lg:inline">Settings</span>
              </button>
            </div>
          </div>
        </header>

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          {/* Left rail */}
          <aside className="w-72 border-r border-slate-800/50 bg-slate-950/30 backdrop-blur">
            <div className="p-5">
              <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-4">
                <div className="text-sm text-slate-400">Project</div>
                <div className="mt-1 font-semibold truncate">{project?.name || '—'}</div>

                <button
                  onClick={() => setSettingsOpen(true)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/40 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">Settings</span>
                </button>
              </div>

              <div className="mt-5 space-y-2">
                {tabs.map((t) => {
                  const active = t.id === tab;
                  return (
                    <button
                      key={t.id}
                      onClick={() => onTabClick(t.id)}
                      className={`w-full px-4 py-3 rounded-2xl border transition-colors flex items-center gap-3 ${
                        active
                          ? 'bg-blue-500/15 border-blue-500/25 text-white'
                          : 'bg-slate-950/15 border-slate-800/60 text-slate-200 hover:bg-slate-900/30'
                      }`}
                    >
                      {t.icon}
                      <span className="font-medium">{t.label}</span>
                      {(t.id === 'files' || t.id === 'resources') && (
                        <span className="ml-auto text-xs text-slate-400">{active && branchOpen ? 'Open' : ' '}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Branch panel (Files/Resources) */}
          {branchOpen && (tab === 'files' || tab === 'resources') && (
            <aside className="w-80 border-r border-slate-800/50 bg-slate-950/30 backdrop-blur">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">{tab === 'files' ? 'Files' : 'Resources'}</div>
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
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="text-slate-200 font-medium text-sm">File structure</div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleNewFolder('root')}
                            className="p-2 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/40"
                            title="New folder"
                          >
                            <FolderPlus className="w-4 h-4 text-slate-200" />
                          </button>
                          <button
                            onClick={() => handleNewDoc('root')}
                            className="p-2 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/40"
                            title="New document"
                          >
                            <FilePlus2 className="w-4 h-4 text-slate-200" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3">
                        <FileTree
                          node={fileRoot}
                          depth={0}
                          expanded={expanded}
                          selectedId={selectedFileId}
                          onToggle={toggleExpanded}
                          onSelect={(id) => {
                            const n = findNode(fileRoot, id);
                            if (!n) return;
                            if (n.type === 'folder') {
                              toggleExpanded(n.id);
                            } else {
                              setSelectedFileId(n.id);
                            }
                          }}
                          onNewFolder={handleNewFolder}
                          onNewDoc={handleNewDoc}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm">Resources navigator will be wired next.</div>
                  )}
                </div>
              </div>
            </aside>
          )}

          {/* Main */}
          <main className="flex-1 min-w-0 p-8">
            {loading ? (
              <div className="text-slate-300">Loading…</div>
            ) : !project ? (
              <div className="text-slate-300">Project not found.</div>
            ) : (
              <>
                {tab === 'overview' && <OverviewTab project={project} />}
                {tab === 'board' && <PlaceholderTab title="Board" desc="Kanban will live here next." />}
                {tab === 'planner' && <PlaceholderTab title="Planner" desc="Manual + AI plan flow will live here next." />}

                {tab === 'files' && (
                  <FilesTab
                    project={project}
                    file={selectedFile}
                    docDraft={docDraft}
                    setDocDraft={setDocDraft}
                    onOpenBranch={() => setBranchOpen(true)}
                  />
                )}

                {tab === 'resources' && <PlaceholderTab title="Resources" desc="Saved links + categories will live here next." />}
              </>
            )}
          </main>
        </div>

        {/* Settings modal */}
        {settingsOpen && project && (
          <Modal title="Project Settings" subtitle="Edit project details" onClose={() => setSettingsOpen(false)} widthClass="w-[860px] max-w-[92vw]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-slate-300 mb-2">Project name</div>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div>
                <div className="text-sm text-slate-300 mb-2">Status</div>
                <Dropdown<ProjectStatus>
                  value={statusDraft}
                  onChange={setStatusDraft}
                  options={[
                    { value: 'planning', label: 'Planning' },
                    { value: 'active', label: 'Active' },
                    { value: 'review', label: 'Review' },
                    { value: 'completed', label: 'Completed' },
                    { value: 'archived', label: 'Archived' },
                  ]}
                  renderValue={(v) => (
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-2xl border text-xs ${statusPill(v)}`}>{v}</span>
                  )}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-sm text-slate-300 mb-2">Description</div>
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-2xl bg-slate-950/40 border border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button onClick={() => setSettingsOpen(false)} className="px-4 py-3 rounded-2xl border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45">
                Cancel
              </button>
              <button
                onClick={saveProjectSettings}
                className="px-4 py-3 rounded-2xl border bg-blue-500/20 border-blue-500/30 text-blue-200 hover:bg-blue-500/25 transition-colors"
              >
                Save
              </button>
            </div>
          </Modal>
        )}

        {/* Quick capture FAB (does not move) */}
        <div className="fixed bottom-7 right-7 z-50">
          <div className="relative">
            {/* menu */}
            <div
              className={[
                'absolute bottom-16 right-0 w-56 rounded-3xl border border-slate-800/60 bg-slate-950/90 backdrop-blur shadow-2xl overflow-hidden',
                'transition-all duration-200',
                qcOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none',
              ].join(' ')}
            >
              <button
                onClick={() => {
                  setQcType('note');
                  setQcText('');
                  setQcOpen(false);
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
                  setQcOpen(false);
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
                  setQcOpen(false);
                  window.setTimeout(() => qcInputRef.current?.focus(), 0);
                }}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-900/55"
              >
                Quick Link
              </button>
            </div>

            {/* button */}
            <button
              onClick={() => {
                setQcOpen((v) => !v);
              }}
              className="h-14 w-14 rounded-2xl border border-blue-500/30 bg-blue-500/20 hover:bg-blue-500/25 shadow-2xl flex items-center justify-center"
              aria-label="Quick capture"
            >
              <span className={['transition-transform duration-200', qcOpen ? 'rotate-45' : 'rotate-0'].join(' ')}>
                <Plus className="w-6 h-6 text-blue-200" />
              </span>
            </button>
          </div>
        </div>

        {/* Quick capture editor */}
        {qcType && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-6">
            <button
              className="absolute inset-0 bg-black/55"
              onClick={() => {
                setQcType(null);
              }}
              aria-label="Close"
            />

            <div className="relative w-[640px] max-w-[95vw] rounded-3xl border border-slate-800/60 bg-slate-950/92 backdrop-blur p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">{qcType === 'note' ? 'Quick Note' : qcType === 'task' ? 'Quick Task' : 'Quick Link'}</div>
                  <div className="mt-1 text-slate-300 text-sm">Saved to this project</div>
                </div>
                <button
                  onClick={() => setQcType(null)}
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
                  placeholder={qcType === 'link' ? 'Paste a link or write details…' : 'Type…'}
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={() => setQcType(null)}
                  className="px-4 py-3 rounded-2xl border border-slate-800/70 bg-slate-900/30 hover:bg-slate-900/45"
                >
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

/* -------------------------------- Components ------------------------------- */

function OverviewTab({ project }: { project: Project }) {
  const st = clampStatus(project.status);
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-2xl font-semibold truncate">{project.name}</div>
            {project.description?.trim() ? (
              <div className="mt-1 text-slate-300">{project.description}</div>
            ) : (
              <div className="mt-1 text-slate-500">No description</div>
            )}
          </div>
          <div className={`shrink-0 px-3 py-1 rounded-2xl border text-xs ${statusPill(st)}`}>{st}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Tasks" value="—" note="Board will calculate this" />
        <StatCard title="Plan Progress" value="—" note="Planner will calculate this" />
        <StatCard title="Last Updated" value={formatRelative(project.updated_at || project.created_at)} note="Auto" />
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
        <div className="font-semibold">Pinned</div>
        <div className="mt-2 text-slate-400 text-sm">Pinned notes/tasks will live here next.</div>
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
        <div className="font-semibold">Recent Activity</div>
        <div className="mt-2 text-slate-400 text-sm">Activity feed will live here next.</div>
      </div>
    </div>
  );
}

function FilesTab({
  project,
  file,
  docDraft,
  setDocDraft,
  onOpenBranch,
}: {
  project: Project;
  file: FileNode | null;
  docDraft: string;
  setDocDraft: (v: string) => void;
  onOpenBranch: () => void;
}) {
  const isDoc = file?.type === 'doc';
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-2xl font-semibold">Files</div>
          <div className="mt-1 text-slate-400 text-sm">Create folders and documents. Content saves automatically.</div>
        </div>

        <button
          onClick={onOpenBranch}
          className="px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/40 transition-colors"
        >
          Open file tree
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-slate-300" />
          <div className="font-semibold truncate">{isDoc ? file?.name : 'Select a document'}</div>
        </div>

        <div className="mt-4">
          {isDoc ? (
            <textarea
              value={docDraft}
              onChange={(e) => setDocDraft(e.target.value)}
              rows={14}
              className="w-full px-4 py-3 rounded-2xl bg-slate-950/35 border border-slate-800/60 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
              placeholder="Write here…"
            />
          ) : (
            <div className="text-slate-400 text-sm">Pick a document from the file tree.</div>
          )}
        </div>

        <div className="mt-4 text-xs text-slate-500">Project: {project.name}</div>
      </div>
    </div>
  );
}

function StatCard({ title, value, note }: { title: string; value: string; note?: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
      <div className="text-sm text-slate-300">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {note ? <div className="mt-2 text-sm text-slate-400">{note}</div> : null}
    </div>
  );
}

function PlaceholderTab({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/60 bg-slate-950/25 p-6">
      <div className="text-2xl font-semibold">{title}</div>
      <div className="mt-2 text-slate-400">{desc}</div>
    </div>
  );
}

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

function Dropdown<T extends string>({
  value,
  onChange,
  options,
  renderValue,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  renderValue: (v: T) => React.ReactNode;
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

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/45 transition-colors"
      >
        <span className="inline-flex items-center gap-2">{renderValue(value)}</span>
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

function FileTree({
  node,
  depth,
  expanded,
  selectedId,
  onToggle,
  onSelect,
  onNewFolder,
  onNewDoc,
}: {
  node: FileNode;
  depth: number;
  expanded: Record<string, boolean>;
  selectedId: string;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  onNewFolder: (parentId: string) => void;
  onNewDoc: (parentId: string) => void;
}) {
  const isFolder = node.type === 'folder';
  const isExpanded = !!expanded[node.id];
  const isSelected = node.id === selectedId;

  const indent = depth * 12;

  return (
    <div>
      <div
        className={`w-full rounded-2xl px-3 py-2 flex items-center gap-2 text-sm transition-colors ${
          isSelected ? 'bg-blue-500/15 border border-blue-500/25' : 'hover:bg-slate-900/35'
        }`}
        style={{ marginLeft: indent }}
      >
        {isFolder ? (
          <button onClick={() => onToggle(node.id)} className="p-1 rounded-lg hover:bg-slate-800/40" aria-label="Toggle folder">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-300" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-300" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        <button onClick={() => onSelect(node.id)} className="flex-1 text-left truncate" title={node.name}>
          <span className="inline-flex items-center gap-2">
            {isFolder ? <FolderTree className="w-4 h-4 text-slate-300" /> : <FileText className="w-4 h-4 text-slate-300" />}
            <span className="text-slate-200">{node.name}</span>
          </span>
        </button>

        {isFolder && (
          <div className="flex items-center gap-1">
            <button onClick={() => onNewFolder(node.id)} className="p-1 rounded-lg hover:bg-slate-800/40" title="New folder">
              <FolderPlus className="w-4 h-4 text-slate-300" />
            </button>
            <button onClick={() => onNewDoc(node.id)} className="p-1 rounded-lg hover:bg-slate-800/40" title="New document">
              <FilePlus2 className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        )}
      </div>

      {isFolder && isExpanded && (node.children || []).length > 0 && (
        <div className="mt-1 space-y-1">
          {(node.children || []).map((c) => (
            <FileTree
              key={c.id}
              node={c}
              depth={depth + 1}
              expanded={expanded}
              selectedId={selectedId}
              onToggle={onToggle}
              onSelect={onSelect}
              onNewFolder={onNewFolder}
              onNewDoc={onNewDoc}
            />
          ))}
        </div>
      )}
    </div>
  );
}
