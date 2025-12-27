import { useState, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Quicklink {
  id: string;
  title: string;
  url: string;
  icon: string;
  order_index: number;
}

interface Props {
  editMode?: boolean;
}

export function Quicklinks({ editMode = false }: Props) {
  const [links, setLinks] = useState<Quicklink[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<Quicklink | null>(null);
  const [editingLink, setEditingLink] = useState<Quicklink | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [icon, setIcon] = useState('🔗');

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
      icon,
      order_index: links.length,
    });

    if (!error) {
      resetForm();
      loadLinks();
    }
  };

  const updateLink = async () => {
    if (!editingLink || !title || !url) return;

    const { error } = await supabase
      .from('quicklinks')
      .update({ title, url, icon })
      .eq('id', editingLink.id);

    if (!error) {
      resetForm();
      loadLinks();
    }
  };

  const deleteLink = async () => {
    if (!linkToDelete) return;

    const { error } = await supabase
      .from('quicklinks')
      .delete()
      .eq('id', linkToDelete.id);

    if (!error) {
      setShowDeleteModal(false);
      setLinkToDelete(null);
      loadLinks();
    }
  };

  const confirmDelete = (link: Quicklink) => {
    setLinkToDelete(link);
    setShowDeleteModal(true);
  };

  const startEdit = (link: Quicklink) => {
    setEditingLink(link);
    setTitle(link.title);
    setUrl(link.url);
    setIcon(link.icon || '🔗');
    setShowForm(true);
  };

  const resetForm = () => {
    setTitle('');
    setUrl('');
    setIcon('🔗');
    setShowForm(false);
    setEditingLink(null);
  };

  const formatUrl = (url: string) => {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    return url;
  };

  // READ-ONLY MODE (Home page)
  if (!editMode) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4">
        {links.map((link) => (
          <a
            key={link.id}
            href={formatUrl(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-slate-800/50 hover:bg-slate-700/50 backdrop-blur rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition-all flex flex-col items-center justify-center text-center"
          >
            <div className="text-4xl mb-3">{link.icon || '🔗'}</div>
            <h3 className="text-white font-medium group-hover:text-blue-400 transition-colors">
              {link.title}
            </h3>
          </a>
        ))}
        
        {links.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400">
            No quick links yet.
          </div>
        )}
      </div>
    );
  }

  // EDIT MODE (Utilities page)
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-1">Quick Links</h2>
          <p className="text-sm text-slate-400">Drag and drop to reorder · Click to edit</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Link
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-slate-900/50 rounded-lg border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingLink ? 'Edit Link' : 'Add New Link'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-slate-300 mb-2">Icon (emoji)</label>
              <input
                type="text"
                placeholder="🔗"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Title</label>
              <input
                type="text"
                placeholder="Link Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={editingLink ? updateLink : addLink}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
              >
                {editingLink ? 'Update Link' : 'Add Link'}
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Links Grid (Editable) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {links.map((link) => (
          <div
            key={link.id}
            className="group relative bg-slate-900/50 hover:bg-slate-900/80 rounded-xl p-6 border border-slate-700/50 flex flex-col items-center justify-center text-center transition-all"
          >
            <button className="absolute top-2 left-2 p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
              <GripVertical className="w-4 h-4 text-slate-400" />
            </button>
            
            <div className="text-4xl mb-3">{link.icon || '🔗'}</div>
            <h3 className="text-white font-medium mb-3">{link.title}</h3>
            
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => startEdit(link)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Pencil className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => confirmDelete(link)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {links.length === 0 && !showForm && (
        <p className="text-slate-400 text-center py-12">
          No quick links yet. Add one to get started!
        </p>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && linkToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 max-w-md w-full mx-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-white mb-2">Delete Quick Link?</h3>
              <p className="text-slate-400">
                Are you sure you want to delete "{linkToDelete.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLinkToDelete(null);
                }}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteLink}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
