import { useState, useEffect } from 'react';
import { Plus, ExternalLink, Trash2, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Quicklink {
  id: string;
  title: string;
  url: string;
  icon: string;
  order_index: number;
}

export function Quicklinks() {
  const [links, setLinks] = useState<Quicklink[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    const { data, error } = await supabase
      .from('quicklinks')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data) {
      setLinks(data);
    }
  };

  const addLink = async () => {
    if (!title || !url) return;

    const { error } = await supabase.from('quicklinks').insert({
      title,
      url,
      order_index: links.length,
    });

    if (!error) {
      setTitle('');
      setUrl('');
      setShowForm(false);
      loadLinks();
    }
  };

  const deleteLink = async (id: string) => {
    const { error } = await supabase.from('quicklinks').delete().eq('id', id);

    if (!error) {
      loadLinks();
    }
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
          <LinkIcon className="w-5 h-5" />
          Quick Links
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      {showForm && (
        <div className="mb-4 space-y-2 p-4 bg-slate-900/50 rounded-lg">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="url"
            placeholder="URL"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={addLink}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
          >
            Add Link
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {links.map((link) => (
          <div
            key={link.id}
            className="group relative bg-slate-900/50 hover:bg-slate-900/80 rounded-lg p-3 transition-colors"
          >
            <a
              href={formatUrl(link.url)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="truncate">{link.title}</span>
            </a>
            <button
              onClick={() => deleteLink(link.id)}
              className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
      </div>

      {links.length === 0 && !showForm && (
        <p className="text-slate-400 text-center py-8">No quick links yet. Add one to get started!</p>
      )}
    </div>
  );
}
