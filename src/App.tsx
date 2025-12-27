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
import { Home, Wrench, Shield, Menu, X, AlertTriangle } from 'lucide-react';

type View =
  | { type: 'home' }
  | { type: 'utilities' }
  | { type: 'admin' }
  | { type: 'tool'; tool: string }
  | { type: 'secret'; code: string }
  | { type: 'paste'; code: string }
  | { type: 'paste-list' };

function App() {
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
  const [banner, setBanner] = useState<{ enabled: boolean; text: string } | null>(null);

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

  useEffect(() => {
    const load = async () => {
      try {
        const saved = localStorage.getItem('olio_banner');
        if (saved) {
          setBanner(JSON.parse(saved));
        } else {
          setBanner({ enabled: false, text: '' });
        }
      } catch {
        setBanner({ enabled: false, text: '' });
      }
    };
    load();
  }, []);

  useEffect(() => {
    const path = window.location.pathname;

    if (path.startsWith('/s/')) {
      const code = path.replace('/s/', '').split('/')[0];
      setView({ type: 'secret', code });
      return;
    }

    if (path.startsWith('/p/')) {
      const code = path.replace('/p/', '').split('/')[0];
      setView({ type: 'paste', code });
      return;
    }

    if (path === '/pastes') {
      setView({ type: 'paste-list' });
      return;
    }

    // If it looks like a short URL code
    const maybeCode = path.replace('/', '');
    if (maybeCode && !['home', 'utilities', 'admin'].includes(maybeCode)) {
      setView({ type: 'tool', tool: 'redirect' });
      return;
    }

    // Default route
    setView({ type: 'home' });
  }, []);

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  const formatTime = (date: Date) => {
    // 12-hour with AM/PM, live
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

  const navItems = [
    { id: 'home', label: 'Home', icon: <Home className="w-5 h-5" />, view: { type: 'home' as const } },
    { id: 'utilities', label: 'Utilities', icon: <Wrench className="w-5 h-5" />, view: { type: 'utilities' as const } },
    { id: 'admin', label: 'Admin', icon: <Shield className="w-5 h-5" />, view: { type: 'admin' as const } },
  ];

  const renderHome = () => (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-indigo-300">Quick Links</h2>
      </div>
      <Quicklinks editMode={false} />
    </div>
  );

  const renderUtilities = () => {
    const [showDescriptions, setShowDescriptions] = useState(() => {
      try {
        const saved = localStorage.getItem('utilities_show_desc');
        return saved === 'true';
      } catch {
        return false;
      }
    });

    useEffect(() => {
      try {
        localStorage.setItem('utilities_show_desc', String(showDescriptions));
      } catch {
        // ignore
      }
    }, [showDescriptions]);

    if (view.type === 'tool') {
      if (view.tool === 'redirect') return <URLRedirect />;
    }

    if (view.type === 'tool') {
      return (
        <div className="space-y-6">
          <button
            onClick={() => setView({ type: 'utilities' })}
            className="text-slate-300 hover:text-white flex items-center gap-2"
          >
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

    return (
      <div className="space-y-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-3xl font-semibold text-white">Utilities</h2>
          </div>

          <button
            onClick={() => setShowDescriptions((v) => !v)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-700 bg-slate-900/30 hover:bg-slate-900/50 text-slate-200 transition-colors"
            aria-pressed={showDescriptions}
          >
            <div className="h-6 w-6 rounded-lg border border-slate-700 bg-slate-800/60 flex items-center justify-center">
              <span className="text-sm font-semibold text-slate-200">i</span>
            </div>
            <span className="text-sm font-medium">
              {showDescriptions ? 'Hide Descriptions' : 'Show Descriptions'}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilities.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setView({ type: 'tool', tool: tool.id })}
              className="group text-left bg-slate-900/30 border border-slate-800/60 hover:border-slate-700 rounded-2xl p-6 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-center text-lg">
                  {tool.icon}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{tool.label}</div>
                  {showDescriptions && (
                    <div className="text-sm text-slate-400 mt-1">{tool.desc}</div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="relative z-20 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur">
          <div className="px-8 py-6 flex items-start justify-between">
            <div className="flex items-start gap-6">
              <button
                onClick={toggleSidebar}
                className="p-3 hover:bg-slate-800/50 bg-slate-900/30 border border-slate-800/60 rounded-xl transition-colors"
                aria-label="Toggle menu"
              >
                {sidebarOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
              </button>

              <div className="pt-0.5">
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                  Olio Workstation
                </h1>
                <p className="mt-3 text-xl text-slate-300">
                  {getGreeting()} · {formatDate(currentTime)} ·{' '}
                  <span className="font-mono text-slate-200">{formatTime(currentTime)}</span>
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Maintenance Banner */}
        {banner?.enabled && banner.text?.trim() && (
          <div className="relative z-20 px-8 pt-4">
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 backdrop-blur px-5 py-4 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl border border-amber-500/25 bg-amber-500/10 flex items-center justify-center flex-none">
                <AlertTriangle className="w-5 h-5 text-amber-200" />
              </div>
              <div className="text-base text-amber-100 leading-snug">
                {banner.text}
              </div>
            </div>
          </div>
        )}

        <div className="relative z-10 flex flex-1">
          {/* Sidebar */}
          {sidebarOpen && (
            <aside className="w-64 border-r border-slate-800/50 bg-slate-950/40 backdrop-blur">
              <nav className="p-4 space-y-3">
                {navItems.map((item) => {
                  const active =
                    (view.type === 'home' && item.id === 'home') ||
                    (view.type === 'utilities' && item.id === 'utilities') ||
                    (view.type === 'admin' && item.id === 'admin') ||
                    (view.type === 'tool' && item.id === 'utilities') ||
                    (view.type === 'secret' && item.id === 'utilities') ||
                    (view.type === 'paste' && item.id === 'utilities') ||
                    (view.type === 'paste-list' && item.id === 'utilities');

                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.view)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                        active
                          ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                          : 'hover:bg-slate-800/40 text-slate-200'
                      }`}
                    >
                      {item.icon}
                      <span className="text-base font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 p-8">
            {view.type === 'home' && renderHome()}
            {view.type === 'utilities' && renderUtilities()}
            {view.type === 'tool' && renderUtilities()}
            {view.type === 'secret' && <SecretView code={view.code} />}
            {view.type === 'paste' && <PasteView code={view.code} />}
            {view.type === 'paste-list' && <PasteList />}
            {view.type === 'admin' && <Admin />}
            {view.type === 'tool' && view.tool === 'redirect' && <URLRedirect />}
            {view.type === 'tool' && view.tool === 'notfound' && <NotFound />}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
