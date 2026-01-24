import { useState, useEffect } from 'react';
import { AnimatedBackground } from './components/AnimatedBackground';
import { Quicklinks } from './components/Quicklinks';
import { ProjectsCenter } from './components/ProjectsCenter';
import { Triggers } from './components/Triggers';
import { URLShortener } from './components/URLShortener';
import { SecretSharing } from './components/SecretSharing';
import { QRCodeGenerator } from './components/QRCodeGenerator';
import { Pastebin } from './components/Pastebin';
import { URLRedirect } from './pages/URLRedirect';
import { SecretView } from './pages/SecretView';
import { PasteView } from './pages/PasteView';
import { PasteList } from './pages/PasteList';
import { NotFound } from './pages/NotFound';
import Admin from './pages/Admin';
import { UtilitiesHub } from './components/UtilitiesHub';
import { Home, Wrench, Users, Menu, X, AlertTriangle } from 'lucide-react';

import { useAuth } from './auth/AuthContext';
import { Onboarding } from './pages/Onboarding';
import { OrgSetup } from './pages/OrgSetup';
import { OrganizationPage } from './pages/Organization';

// ✅ Standalone projects app pages (no main header/sidebar shell)
import { ProjectsCenterApp } from './pages/ProjectsCenterApp';
import { ProjectDashboard } from './pages/ProjectDashboard';

type View =
  | { type: 'home' }
  | { type: 'utilities' }
  | { type: 'admin' } // hidden (still accessible via /admin)
  | { type: 'organization' }
  | { type: 'tool'; tool: string }
  | { type: 'redirect'; code: string }
  | { type: 'secret'; code: string }
  | { type: 'paste'; code: string }
  | { type: 'paste-list' }
  | { type: 'projects-center' }
  | { type: 'project-dashboard'; id: string };

type BannerState = { enabled: boolean; text: string };

function App() {
  const { loading: authLoading, hydrated, user, orgId, orgLoading, authError, orgError } = useAuth();

  const [view, setView] = useState<View>({ type: 'home' });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebarOpen');
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  // Banner comes from the same API Admin uses
  const [banner, setBanner] = useState<BannerState>({ enabled: false, text: '' });

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('sidebarOpen', String(sidebarOpen));
    } catch {
      // ignore
    }
  }, [sidebarOpen]);

  // Load banner from /api/public/settings
  useEffect(() => {
    let cancelled = false;

    async function loadBanner() {
      try {
        const r = await fetch('/api/public/settings');
        const j = await r.json();
        if (cancelled) return;

        setBanner({
          enabled: !!j.bannerEnabled,
          text: j.bannerText || '',
        });
      } catch {
        if (cancelled) return;
        setBanner({ enabled: false, text: '' });
      }
    }

    loadBanner();

    // Refresh when tab regains focus (so after saving in Admin it shows on Home)
    const onVis = () => {
      if (document.visibilityState === 'visible') loadBanner();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  // Route resolution order:
  // 1) Known app routes
  // 2) Known prefixes (/s/:code, /p/:code)
  // 3) Unknown single-segment -> URL shortener redirect lookup
  // 4) Otherwise -> home
  useEffect(() => {
    const resolve = () => {
      const path = window.location.pathname || '/';
      const cleanPath = path.replace(/\/+$/, '') || '/';

      // ✅ Projects routes (standalone)
      if (cleanPath === '/projects') {
        setView({ type: 'projects-center' });
        return;
      }
      if (cleanPath.startsWith('/projects/')) {
        const id = cleanPath.replace('/projects/', '').split('/')[0];
        if (id) setView({ type: 'project-dashboard', id });
        else setView({ type: 'projects-center' });
        return;
      }

      // Hidden admin route
      if (cleanPath === '/admin') {
        setView({ type: 'admin' });
        if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
        return;
      }

      if (cleanPath === '/utilities') {
        setView({ type: 'utilities' });
        if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
        return;
      }

      if (cleanPath === '/organization' || cleanPath === '/org') {
        setView({ type: 'organization' });
        if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
        return;
      }

      if (cleanPath === '/p' || cleanPath === '/pastes') {
        setView({ type: 'paste-list' });
        if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
        return;
      }

      if (cleanPath.startsWith('/s/')) {
        const code = cleanPath.replace('/s/', '').split('/')[0];
        if (code) setView({ type: 'secret', code });
        else setView({ type: 'tool', tool: 'notfound' });
        return;
      }

      // Legacy secret route
      if (cleanPath.startsWith('/secret/')) {
        const code = cleanPath.replace('/secret/', '').split('/')[0];
        if (code) setView({ type: 'secret', code });
        else setView({ type: 'tool', tool: 'notfound' });
        return;
      }

      if (cleanPath.startsWith('/p/')) {
        const code = cleanPath.replace('/p/', '').split('/')[0];
        if (code) setView({ type: 'paste', code });
        else setView({ type: 'tool', tool: 'notfound' });
        return;
      }

      // Legacy paste route
      if (cleanPath.startsWith('/paste/')) {
        const code = cleanPath.replace('/paste/', '').split('/')[0];
        if (code) setView({ type: 'paste', code });
        else setView({ type: 'tool', tool: 'notfound' });
        return;
      }

      // Unknown single segment -> URL shortener redirect lookup
      const maybeCode = cleanPath.replace(/^\//, '');
      if (
        maybeCode &&
        !['home', 'admin', 'utilities', 'p', 'pastes', 'projects', 'organization', 'org'].includes(maybeCode)
      ) {
        setView({ type: 'redirect', code: maybeCode });
        return;
      }

      setView({ type: 'home' });
    };

    resolve();

    window.addEventListener('popstate', resolve);
    return () => window.removeEventListener('popstate', resolve);
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const utilities = [
    { id: 'quicklinks', label: 'Quick Links', icon: '🔗', desc: 'Manage bookmarks' },
    { id: 'projects', label: 'Projects', icon: '📁', desc: 'Track your work' },
    { id: 'triggers', label: 'Triggers', icon: '⚡', desc: 'Run webhooks' },
    { id: 'shortener', label: 'URL Shortener', icon: '✂️', desc: 'Shorten URLs' },
    { id: 'secrets', label: 'Secret Sharing', icon: '🔒', desc: 'One-time links' },
    { id: 'qr', label: 'QR Generator', icon: '📱', desc: 'Generate QR codes' },
    { id: 'pastebin', label: 'Pastebin', icon: '📝', desc: 'Share code/text' },
  ];

  // ✅ Admin removed from sidebar; replaced with Organization
  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, view: { type: 'home' as const } },
    { id: 'utilities', label: 'Utilities', icon: <Wrench className="w-5 h-5" />, view: { type: 'utilities' as const } },
    { id: 'organization', label: 'Organization', icon: <Users className="w-5 h-5" />, view: { type: 'organization' as const } },
  ];

  // Public routes (no auth/org required). These are safe to view without signing in.
  const isPublicRoute =
    view.type === 'secret' ||
    view.type === 'paste' ||
    view.type === 'paste-list' ||
    view.type === 'redirect';

  // ✅ Gate the main dashboard behind auth + org membership.
  // Public routes (secrets/pastes/redirects) bypass this.
  if (!isPublicRoute) {
  // ✅ Only block the entire UI during the FIRST ever hydrate.
  // After hydrated=true, orgLoading can happen in the background without nuking the UI.
  if (!hydrated && (authLoading || orgLoading)) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="rounded-3xl bg-zinc-900 px-6 py-5 text-center max-w-md w-full text-white">
          <h2 className="text-lg font-semibold text-white">Loading...</h2>
          <p className="text-sm text-white/70">Preparing your workspace.</p>

          {(authError || orgError) && (
            <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-amber-100 text-sm text-left">
              {authError ? `Auth error: ${authError}` : `Org error: ${orgError}`}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) return <Onboarding />;
  if (!orgId) return <OrgSetup />;
}


  const renderHome = () => (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-indigo-300">Quick Links</h2>
      </div>
      <Quicklinks editMode={false} />
    </div>
  );

  const renderUtilities = () => {
    if (view.type === 'tool') {
      return (
        <div className="space-y-6">
          <button onClick={() => setView({ type: 'utilities' })} className="text-slate-300 hover:text-white flex items-center gap-2">
            ← Back to Utilities
          </button>

          {view.tool === 'quicklinks' && <Quicklinks editMode={true} />}
          {view.tool === 'projects' && <ProjectsCenter />}
          {view.tool === 'triggers' && <Triggers />}
          {view.tool === 'shortener' && <URLShortener />}
          {view.tool === 'secrets' && <SecretSharing />}
          {view.tool === 'qr' && <QRCodeGenerator />}
          {view.tool === 'pastebin' && <Pastebin />}
        </div>
      );
    }

    return <UtilitiesHub tools={utilities} onOpenTool={(toolId) => setView({ type: 'tool', tool: toolId })} />;
  };

  // ✅ Standalone projects app pages (no main header/sidebar shell)
  if (view.type === 'projects-center') {
    return <ProjectsCenterApp onOpenProject={(id) => navigateTo(`/projects/${id}`)} />;
  }

  if (view.type === 'project-dashboard') {
    return <ProjectDashboard projectId={view.id} />;
  }

  return (
    <div className="min-h-screen text-white relative overflow-x-hidden">
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-20 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur">
          <div className="px-4 sm:px-6 md:px-10 py-5 sm:py-6 md:py-7 flex items-start justify-between">
            <div className="flex items-start gap-8">
              <button
                onClick={toggleSidebar}
                className="p-3 sm:p-4 hover:bg-slate-800/50 bg-slate-900/30 border border-slate-800/60 rounded-2xl transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X className="w-6 h-6 sm:w-7 sm:h-7" /> : <Menu className="w-6 h-6 sm:w-7 sm:h-7" />}
              </button>

              <div className="pt-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-white">Olio Workstation</h1>

                <p className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-xl text-slate-300">
                  {getGreeting()} · {formatDate(currentTime)} · <span className="font-mono text-slate-200">{formatTime(currentTime)}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Maintenance Banner */}
        {banner.enabled && banner.text?.trim() && (
          <div className="relative z-20 px-4 sm:px-6 md:px-10 pt-4 sm:pt-5">
            <div className="rounded-3xl border border-amber-500/25 bg-amber-500/12 backdrop-blur px-6 py-5 flex items-start gap-4">
              <div className="h-11 w-11 rounded-2xl border border-amber-500/25 bg-amber-500/12 flex items-center justify-center flex-none">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-base md:text-lg text-amber-100 leading-snug">{banner.text}</div>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-1">
          {/* Sidebar (mobile overlay) */}
          {sidebarOpen && (
            <>
              <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />

              <aside className="fixed md:static inset-y-0 left-0 z-30 md:z-auto w-72 border-r border-slate-800/50 bg-slate-950/70 md:bg-slate-950/40 backdrop-blur">
                <nav className="p-4 sm:p-5 space-y-3">
                  {navItems.map((item) => {
                    const active =
                      (view.type === 'home' && item.id === 'home') ||
                      (view.type === 'utilities' && item.id === 'utilities') ||
                      (view.type === 'organization' && item.id === 'organization') ||
                      (view.type === 'tool' && item.id === 'utilities') ||
                      (view.type === 'secret' && item.id === 'utilities') ||
                      (view.type === 'paste' && item.id === 'utilities') ||
                      (view.type === 'paste-list' && item.id === 'utilities') ||
                      (view.type === 'redirect' && item.id === 'utilities');

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setView(item.view);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3.5 sm:py-4 rounded-2xl transition-colors ${
                          active ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200' : 'hover:bg-slate-800/40 text-slate-200'
                        }`}
                      >
                        {item.icon}
                        <span className="text-sm sm:text-base font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </aside>
            </>
          )}

          {/* Main Content */}
          <main className="flex-1 p-4 sm:p-6 md:p-10">
            {view.type === 'home' && renderHome()}
            {view.type === 'utilities' && renderUtilities()}
            {view.type === 'tool' && renderUtilities()}
            {view.type === 'organization' && <OrganizationPage />}
            {view.type === 'redirect' && <URLRedirect shortCode={view.code} />}
            {view.type === 'secret' && <SecretView secretCode={view.code} />}
            {view.type === 'paste' && <PasteView pasteCode={view.code} />}
            {view.type === 'paste-list' && <PasteList />}
            {view.type === 'admin' && <Admin />}
            {view.type === 'tool' && view.tool === 'notfound' && <NotFound />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;

function navigateTo(path: string) {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}
