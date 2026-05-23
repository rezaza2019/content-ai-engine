import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Plus, Trash2, Link as LinkIcon, RefreshCcw, Save, Edit2, X } from 'lucide-react';

export interface ApiUrl {
  id: string;
  name: string;
  url: string;
}

export default function ApiUrls() {
  const [urls, setUrls] = useState<ApiUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const fetchUrls = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/urls');
      if (res.ok) {
        setUrls(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch urls', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    try {
      const res = await fetch('/api/urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, url: newUrl })
      });
      if (res.ok) {
        const added = await res.json();
        setUrls(prev => [...prev, added]);
        setNewName('');
        setNewUrl('');
        setIsAdding(false);
      }
    } catch (err) {
      console.error('Failed to save url', err);
    }
  };

  const startEdit = (url: ApiUrl) => {
    setEditingId(url.id);
    setEditName(url.name);
    setEditUrl(url.url);
  };

  const handleEdit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editName.trim() || !editUrl.trim()) return;

    try {
      const res = await fetch(`/api/urls/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, url: editUrl })
      });
      if (res.ok) {
        const updated = await res.json();
        setUrls(prev => prev.map(u => u.id === id ? updated : u));
        setEditingId(null);
      }
    } catch (err) {
      console.error('Failed to update url', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/urls/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUrls(prev => prev.filter(u => u.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete url', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Database className="text-indigo-600" size={28} />
            Data Sources
          </h2>
          <p className="text-slate-500 mt-2 font-medium">Manage your Daisycon API endpoints and configurations</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          <Plus size={18} />
          Add Source
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          >
            <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-sm border border-indigo-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <h3 className="text-lg font-bold text-slate-900 mb-4">New Data Source</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Name</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. France Feed"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">API URL</label>
                  <input
                    type="url"
                    value={newUrl}
                    onChange={e => setNewUrl(e.target.value)}
                    placeholder="https://daisycon.io/datafeed/..."
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl transition-all outline-none"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Save size={18} />
                  Save Source
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center p-12 text-slate-400 animate-pulse">
            <RefreshCcw size={24} className="animate-spin" />
          </div>
        ) : urls.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4 shadow-sm">
              <LinkIcon size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No Data Sources</h3>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">You haven't added any API URLs yet. Add one to start exploring data.</p>
          </div>
        ) : (
          urls.map(url => (
            <motion.div
              key={url.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between group hover:border-indigo-200 transition-colors"
            >
              {editingId === url.id ? (
                <form onSubmit={(e) => handleEdit(e, url.id)} className="w-full flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Name"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg transition-all outline-none text-sm font-medium"
                      required
                    />
                    <input
                      type="url"
                      value={editUrl}
                      onChange={e => setEditUrl(e.target.value)}
                      placeholder="URL"
                      className="w-full h-10 px-3 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-lg transition-all outline-none text-sm"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                    <button
                      type="submit"
                      className="w-10 h-10 flex items-center justify-center text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-md shadow-indigo-200"
                      title="Save"
                    >
                      <Save size={18} />
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-4 overflow-hidden mb-4 md:mb-0">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                      <LinkIcon size={20} />
                    </div>
                    <div className="truncate">
                      <h4 className="font-bold text-slate-900 truncate">{url.name}</h4>
                      <p className="text-sm text-slate-500 truncate">{url.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      onClick={() => startEdit(url)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      title="Edit Source"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(url.id)}
                      className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                      title="Delete Source"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
