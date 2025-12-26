import { useState, useEffect } from 'react';
import { Link2, Copy, ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ShortUrl {
  id: string;
  short_code: string;
  target_url: string;
  clicks: number;
  created_at: string;
}

export function URLShortener() {
  const [urls, setUrls] = useState<ShortUrl[]>([]);
  const [targetUrl, setTargetUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadUrls();
  }, []);

  const loadUrls = async () => {
    const { data, error } = await supabase
      .from('short_urls')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setUrls(data);
    }
  };

  const generateShortCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const createShortUrl = async () => {
    if (!targetUrl) return;

    const shortCode = customCode || generateShortCode();

    const { error } = await supabase.from('short_urls').insert({
      short_code: shortCode,
      target_url: targetUrl,
    });

    if (error) {
      if (error.code === '23505') {
        alert('This short code is already taken. Try another one.');
      } else {
        alert('Failed to create short URL');
      }
      return;
    }

    setTargetUrl('');
    setCustomCode('');
    loadUrls();
  };

  const deleteUrl = async (id: string) => {
    const { error } = await supabase.from('short_urls').delete().eq('id', id);

    if (!error) {
      loadUrls();
    }
  };

  const copyToClipboard = (shortCode: string) => {
    const shortUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(shortUrl);
    setCopied(shortCode);
    setTimeout(() => setCopied(null), 2000);
  };

  const getShortUrl = (shortCode: string) => {
    return `${window.location.origin}/${shortCode}`;
  };

  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Link2 className="w-5 h-5" />
          URL Shortener
        </h2>
      </div>

      <div className="mb-4 space-y-2 p-4 bg-slate-900/50 rounded-lg">
        <input
          type="url"
          placeholder="Enter long URL"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="text"
          placeholder="Custom short code (optional)"
          value={customCode}
          onChange={(e) => setCustomCode(e.target.value)}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={createShortUrl}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
        >
          Shorten URL
        </button>
      </div>

      <div className="space-y-3">
        {urls.map((url) => (
          <div
            key={url.id}
            className="group relative bg-slate-900/50 hover:bg-slate-900/80 rounded-lg p-4 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <a
                    href={`/${url.short_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono text-sm"
                  >
                    {getShortUrl(url.short_code)}
                  </a>
                  <button
                    onClick={() => copyToClipboard(url.short_code)}
                    className="p-1 hover:bg-slate-700 rounded transition-colors"
                  >
                    {copied === url.short_code ? (
                      <span className="text-green-400 text-xs">Copied!</span>
                    ) : (
                      <Copy className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
                <p className="text-slate-400 text-sm truncate">{url.target_url}</p>
                <p className="text-slate-500 text-xs mt-1">{url.clicks} clicks</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={formatUrl(url.target_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </a>
                <button
                  onClick={() => deleteUrl(url.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {urls.length === 0 && (
        <p className="text-slate-400 text-center py-8">No shortened URLs yet. Create one to get started!</p>
      )}
    </div>
  );
}
