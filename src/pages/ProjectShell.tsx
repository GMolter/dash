import { useEffect, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { supabase } from '../lib/supabase';

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  tags: string[];
  updated_at: string;
};

export function ProjectShell({
  projectId,
  onBack,
}: {
  projectId?: string;
  onBack: () => void;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!projectId) {
        setProject(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await supabase.from('projects').select('*').eq('id', projectId).single();
      if (cancelled) return;
      setProject((data as Project) || null);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="border-b border-slate-800/50 bg-slate-950/75 backdrop-blur">
          <div className="px-8 py-5 flex items-center justify-between">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-800/60 bg-slate-900/25 hover:bg-slate-900/45 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Back to Projects</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-8 py-10">
          <div className="max-w-3xl rounded-3xl border border-slate-800/60 bg-slate-950/30 backdrop-blur p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-200" />
              </div>

              <div className="min-w-0">
                <div className="text-xl font-semibold">Project Dashboard is next</div>
                <div className="mt-2 text-slate-300">
                  We wired up <span className="text-slate-100 font-medium">/projects</span> and{' '}
                  <span className="text-slate-100 font-medium">/projects/:id</span>. Next we’ll replace this shell with
                  the full Project Dashboard UI (left nav + branch panels + quick capture).
                </div>

                <div className="mt-5 rounded-2xl border border-slate-800/60 bg-slate-900/25 p-4">
                  {loading ? (
                    <div className="text-slate-300">Loading project…</div>
                  ) : project ? (
                    <div className="space-y-1">
                      <div className="text-slate-100 font-semibold truncate">{project.name}</div>
                      {project.description?.trim() ? (
                        <div className="text-slate-300">{project.description}</div>
                      ) : (
                        <div className="text-slate-500">No description</div>
                      )}
                      <div className="text-sm text-slate-400">Status: {project.status}</div>
                    </div>
                  ) : (
                    <div className="text-slate-300">Project not found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
