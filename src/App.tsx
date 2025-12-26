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
import { Layout, Link2, Folder, Zap, Link as LinkIcon, Shield, QrCode, FileText } from 'lucide-react';

type Module = 'quicklinks' | 'projects' | 'triggers' | 'url' | 'secrets' | 'qr' | 'pastebin' | 'all';

type Route =
  | { type: 'dashboard'; module: Module }
  | { type: 'secret'; code: string }
  | { type: 'paste'; code: string }
  | { type: 'paste-list' }
  | { type: 'admin' }
  | { type: 'short-url'; code: string }
  | { type: '404' };

function App() {
  const [activeModule, setActiveModule] = useState<Module>('all');
  const [route, setRoute] = useState<Route>({ type: 'dashboard', module: 'all' });

  // Maintenance banner (from /api/public/settings)
  const [banner, setBanner] = useState<{ enabled: boolean; text: string } | null>(null);

  useEffect(() => {
    const path = window.location.pathname;

    // Known routes (in priority order)
    if (path === '/' || path === '') {
      setRoute({ type: 'dashboard', module: 'all' });
    } else if (path === '/p' || path === '/paste' || path === '/pastes') {
      setRoute({ type: 'paste-list' });
    } else if (path.startsWith('/secret/')) {
      const code = path.substring(8);
      setRoute({ type: 'secret', code });
    } else if (path.startsWith('/paste/')) {
      const code = path.substring(7);
      setRoute({ type: 'paste', code });
    } else if (path === '/admin') {
      setRoute({ type: 'admin' });
    } else {
      // Unknown route - treat as potential short URL
      const code = path.substring(1); // Remove leading slash
      if (code) {
        setRoute({ type: 'short-url', code });
      } else {
        setRoute({ type: '404' });
      }
    }
  }, []);

  // Load banner settings once (safe: if endpoint doesn't exist yet, it fails quietly)
  useEffect(() => {
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((j) => setBanner({ enabled: !!j.bannerEnabled, text: j.bannerText || '' }))
      .catch(() => setBanner({ enabled: false, text: '' }));
  }, []);

  // Render based on route
  if (route.type === 'short-url') {
    return <URLRedirect shortCode={route.code} />;
  } else if (route.type === 'secret') {
    return <SecretView secretCode={route.code} />;
  } else if (route.type === 'paste') {
    return <PasteView pasteCode={route.code} />;
  } else if (route.type === 'paste-list') {
    return <PasteList />;
  } else if (route.type === 'admin') {
    return <Admin />;
  } else if (route.type === '404') {
    return <NotFound />;
  }

  const modules = [
    { id: 'all', name: 'All Modules', icon: Layout },
    { id: 'quicklinks', name: 'Quick Links', icon: LinkIcon },
    { id: 'projects', name: 'Projects', icon: Folder },
    { id: 'triggers', name: 'Triggers', icon: Zap },
    { id: 'url', name: 'URL Shortener', icon: Link2 },
    { id: 'secrets', name: 'Secret Sharing', icon: Shield },
    { id: 'qr', name: 'QR Generator', icon: QrCode },
    { id: 'pastebin', name: 'Pastebin', icon: FileText },
  ];

  const renderModule = (moduleId: Module) => {
    switch (moduleId) {
      case 'quicklinks':
        return <Quicklinks />;
      case 'projects':
        return <ProjectsCenter />;
      case 'triggers':
        return <Triggers />;
      case 'url':
        return <URLShortener />;
      case 'secrets':
        return <SecretSharing />;
      case 'qr':
        return <QRCodeGenerator />;
      case 'pastebin':
        return <Pastebin />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <AnimatedBackground />

      {/* Maintenance Banner */}
      {banner?.enabled && banner.text?.trim() ? (
        <div className="relative z-50 border-b border-amber-500/20 bg-amber-500/10 text-amber-200">
          <div className="max-w-7xl mx-auto px-6 py-2 text-sm">{banner.text}</div>
        </div>
      ) : null}

      {/* Header */}
      <header className="relative z-20 border-b border-slate-800/50 bg-slate-950/60 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/20 flex items-center justify-center">
                <Layout className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Dashboard
                </h1>
                <p className="text-sm text-slate-400">Your personal productivity hub</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <nav className="space-y-2">
              {modules.map((module) => {
                const Icon = module.icon;
                const isActive = activeModule === module.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      setActiveModule(module.id as Module);
                      setRoute({ type: 'dashboard', module: module.id as Module });
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30 text-white'
                        : 'bg-slate-900/40 border-slate-800/50 text-slate-300 hover:bg-slate-800/50 hover:border-slate-700/50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span className="font-medium">{module.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-3">
            {activeModule === 'all' ? (
              <div className="space-y-8">
                <Quicklinks />
                <ProjectsCenter />
                <Triggers />
                <URLShortener />
                <SecretSharing />
                <QRCodeGenerator />
                <Pastebin />
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">{renderModule(activeModule)}</div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;
