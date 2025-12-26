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
import { Layout, Link2, Folder, Zap, Link as LinkIcon, Shield, QrCode, FileText } from 'lucide-react';

type Module = 'quicklinks' | 'projects' | 'triggers' | 'url' | 'secrets' | 'qr' | 'pastebin' | 'all';

type Route = 
  | { type: 'dashboard'; module: Module }
  | { type: 'secret'; code: string }
  | { type: 'paste'; code: string }
  | { type: 'paste-list' }
  | { type: 'short-url'; code: string }
  | { type: '404' };

function App() {
  const [activeModule, setActiveModule] = useState<Module>('all');
  const [route, setRoute] = useState<Route>({ type: 'dashboard', module: 'all' });

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
      // Admin page - will implement later
      setRoute({ type: 'dashboard', module: 'all' });
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

  // Render based on route
  if (route.type === 'short-url') {
    return <URLRedirect shortCode={route.code} />;
  } else if (route.type === 'secret') {
    return <SecretView secretCode={route.code} />;
  } else if (route.type === 'paste') {
    return <PasteView pasteCode={route.code} />;
  } else if (route.type === 'paste-list') {
    return <PasteList />;
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
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <div className="relative z-10">
        <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-20">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-2xl font-bold text-white mb-4">Personal Dashboard</h1>
            <nav className="flex gap-2 overflow-x-auto pb-2">
              {modules.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    onClick={() => setActiveModule(module.id as Module)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      activeModule === module.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {module.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          {activeModule === 'all' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
  );
}

export default App;
