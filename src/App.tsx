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
import { Home, Wrench, Shield, Menu, X, Eye, EyeOff } from 'lucide-react';

type View = 
  | { type: 'home' }
  | { type: 'utilities' }
  | { type: 'admin' }
  | { type: 'tool'; tool: string }
  | { type: 'secret'; code: string }
  | { type: 'paste'; code: string }
  | { type: 'paste-list' }
  | { type: 'short-url'; code: string }
  | { type: '404' };

function App() {
  const [view, setView] = useState<View>({ type: 'home' });
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar-open');
    return saved ? JSON.parse(saved) : false;
  });
  const [banner, setBanner] = useState<{ enabled: boolean; text: string } | null>(null);
  const [showToolDescriptions, setShowToolDescriptions] = useState(() => {
    const saved = localStorage.getItem('utilities-show-descriptions');
    return saved ? JSON.parse(saved) : false;
  });

  // Persist sidebar state
  useEffect(() => {
    localStorage.setItem('sidebar-open', JSON.stringify(sidebarOpen));
  }, [sidebarOpen]);

  // Persist Utilities descriptions toggle
  useEffect(() => {
    localStorage.setItem('utilities-show-descriptions', JSON.stringify(showToolDescriptions));
  }, [showToolDescriptions]);

  // Route detection
  useEffect(() => {
    const path = window.location.pathname;

    if (path === '/' || path === '') {
      setView({ type: 'home' });
    } else if (path === '/p' || path === '/paste' || path === '/pastes') {
      setView({ type: 'paste-list' });
    } else if (path.startsWith('/secret/')) {
      const code = path.substring(8);
      setView({ type: 'secret', code });
    } else if (path.startsWith('/paste/')) {
      const code = path.substring(7);
      setView({ type: 'paste', code });
    } else if (path === '/admin') {
      setView({ type: 'admin' });
    } else {
      const code = path.substring(1);
      if (code) {
        setView({ type: 'short-url', code });
      } else {
        setView({ type: '404' });
      }
    }
  }, []);

  // Load banner settings
  useEffect(() => {
    fetch('/api/public/settings')
      .then((r) => r.json())
      .then((j) => setBanner({ enabled: !!j.bannerEnabled, text: j.bannerText || '' }))
      .catch(() => setBanner({ enabled: false, text: '' }));
  }, []);

  // Handle special routes (non-dashboard views)
  if (view.type === 'short-url') {
    return <URLRedirect shortCode={view.code} />;
  } else if (view.type === 'secret') {
    return <SecretView secretCode={view.code} />;
  } else if (view.type === 'paste') {
    return <PasteView pasteCode={view.code} />;
  } else if (view.type === 'paste-list') {
    return <PasteList />;
  } else if (view.type === '404') {
    return <NotFound />;
  }

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Get current time
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const formatTime = (date: Date) => {
    // Force 12-hour clock with AM/PM (avoid locale/system 24h preferences)
    const hours24 = date.getHours();
    const hours12 = ((hours24 + 11) % 12) + 1; // 1..12
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours24 >= 12 ? 'PM' : 'AM';
    return `${hours12}:${minutes}:${seconds} ${ampm}`;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-20 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur">
        <div className="px-6 py-4 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="text-5xl font-bold text-white leading-tight">Olio Workstation</h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-4xl text-slate-300">
                <span className="font-medium">
                  {getGreeting()} · {formatDate(currentTime)}
                </span>
                <span className="font-mono text-slate-200">
                  {formatTime(currentTime)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Maintenance Banner */}
      {banner?.enabled && banner.text?.trim() && (
        <div className="relative z-20 border-b border-amber-500/30 bg-amber-500/10 backdrop-blur">
          <div className="px-6 py-3 text-sm text-amber-200 flex items-center gap-2">
            <span className="text-lg">🚨</span>
            <span>{banner.text}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 border-r border-slate-800/50 bg-slate-950/60 backdrop-blur min-h-[calc(100vh-73px)]">
            <nav className="p-6 space-y-4">
              <button
                onClick={() => setView({ type: 'home' })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  view.type === 'home'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Home className="w-7 h-7" />
                <span className="font-semibold text-2xl">Home</span>
              </button>
              
              <button
                onClick={() => setView({ type: 'utilities' })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  view.type === 'utilities' || view.type === 'tool'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Wrench className="w-7 h-7" />
                <span className="font-semibold text-2xl">Utilities</span>
              </button>

              <button
                onClick={() => setView({ type: 'admin' })}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  view.type === 'admin'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-300 hover:bg-slate-800/50'
                }`}
              >
                <Shield className="w-7 h-7" />
                <span className="font-semibold text-2xl">Admin</span>
              </button>
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {view.type === 'home' && (
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Quick Links
                </h2>
              </div>
              <Quicklinks editMode={false} />
            </div>
          )}

          {view.type === 'utilities' && (
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Utilities
                </h2>
                <button
                  type="button"
                  role="switch"
                  aria-checked={showToolDescriptions}
                  onClick={() => setShowToolDescriptions((v) => !v)}
                  className="group flex items-center gap-3 rounded-xl border border-slate-700/60 bg-slate-900/30 px-4 py-3 text-sm text-slate-200 transition-colors hover:bg-slate-900/50"
                  title={showToolDescriptions ? 'Hide tool descriptions' : 'Show tool descriptions'}
                >
                  <span className="flex items-center gap-2">
                    {showToolDescriptions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span className="font-medium">Descriptions</span>
                  </span>
                  <span
                    className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-colors ${
                      showToolDescriptions
                        ? 'bg-blue-500/25 border-blue-500/40'
                        : 'bg-slate-800/60 border-slate-700/60'
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white/90 shadow transition-transform ${
                        showToolDescriptions ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { id: 'quicklinks', name: 'Quick Links', icon: '🔗', desc: 'Manage bookmarks' },
                  { id: 'projects', name: 'Projects', icon: '📁', desc: 'Track your work' },
                  { id: 'triggers', name: 'Triggers', icon: '⚡', desc: 'Run webhooks' },
                  { id: 'url', name: 'URL Shortener', icon: '🔗', desc: 'Create short URLs' },
                  { id: 'secrets', name: 'Secret Sharing', icon: '🔒', desc: 'One-time secrets' },
                  { id: 'qr', name: 'QR Generator', icon: '📱', desc: 'Generate QR codes' },
                  { id: 'pastebin', name: 'Pastebin', icon: '📝', desc: 'Share code/text' },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => setView({ type: 'tool', tool: tool.id })}
                    className="bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all text-left"
                  >
                    <div className="text-3xl mb-3">{tool.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-2">{tool.name}</h3>
                    {showToolDescriptions && (
                      <p className="text-sm text-slate-400">{tool.desc}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {view.type === 'tool' && (
            <div className="max-w-6xl mx-auto">
              <button
                onClick={() => setView({ type: 'utilities' })}
                className="mb-6 flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
              >
                ← Back to Utilities
              </button>
              
              {view.tool === 'quicklinks' && <Quicklinks editMode={true} />}
              {view.tool === 'projects' && <ProjectsCenter />}
              {view.tool === 'triggers' && <Triggers />}
              {view.tool === 'url' && <URLShortener />}
              {view.tool === 'secrets' && <SecretSharing />}
              {view.tool === 'qr' && <QRCodeGenerator />}
              {view.tool === 'pastebin' && <Pastebin />}
            </div>
          )}

          {view.type === 'admin' && <Admin />}
        </main>
      </div>
    </div>
  );
}

export default App;
