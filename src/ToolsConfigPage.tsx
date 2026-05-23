import { useState, useEffect } from 'react';
import { Save, ExternalLink, Settings, Link2, Plus, X, Trash2, Edit2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ConfigLink {
  id: string;
  name: string;
  url: string;
}

export default function ToolsConfigPage() {
  const [links, setLinks] = useState<ConfigLink[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ConfigLink | null>(null);
  const [formData, setFormData] = useState({ name: '', url: '' });

  useEffect(() => {
    fetch('/api/config-links')
      .then(res => {
        if (!res.ok) throw new Error(`Server returned ${res.status}`);
        return res.json();
      })
      .then(data => setLinks(data))
      .catch(err => console.error('Fetch error:', err));
  }, []);

  const handleSaveAll = async (updatedLinks: ConfigLink[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/config-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedLinks)
      });
      if (res.ok) {
        setLinks(updatedLinks);
        setMessage({ type: 'success', text: 'Configuration saved successfully!' });
      } else {
        setMessage({ type: 'error', text: 'Failed to save configuration.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error.' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const openCreateModal = () => {
    setEditingLink(null);
    setFormData({ name: '', url: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (link: ConfigLink) => {
    setEditingLink(link);
    setFormData({ name: link.name, url: link.url });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    let updatedLinks;
    if (editingLink) {
      updatedLinks = links.map(l => l.id === editingLink.id ? { ...l, ...formData } : l);
    } else {
      const newLink = { id: Date.now().toString(), ...formData };
      updatedLinks = [...links, newLink];
    }
    handleSaveAll(updatedLinks);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this tool?')) {
      handleSaveAll(links.filter(l => l.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Tools Configuration</h2>
          <p className="text-slate-500 font-medium text-sm">Configure helper links for content generation</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          Create a Link
        </button>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' : 'bg-red-50 border-red-100 text-red-700'
          }`}
        >
          <Settings size={18} />
          {message.text}
        </motion.div>
      )}

      <div className="grid gap-4">
        {links.map((link) => (
          <div key={link.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Link2 size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{link.name}</h3>
                <p className="text-xs text-slate-400 font-mono truncate max-w-md">{link.url}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => openEditModal(link)}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                title="Edit"
              >
                <Edit2 size={18} />
              </button>
              <button 
                onClick={() => handleDelete(link.id)}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                title="Delete"
              >
                <Trash2 size={18} />
              </button>
              <a 
                href={link.url.replace('{query}', 'test').replace('{url}', 'https://google.com')} 
                target="_blank" 
                rel="noreferrer"
                className="ml-2 p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                title="Test Link"
              >
                <ExternalLink size={18} />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight">
                    {editingLink ? 'Edit Tool Link' : 'Create New Link'}
                  </h3>
                  <p className="text-sm text-slate-400 font-medium">Configure your generation tool</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Tool Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pixabay Search"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">URL Pattern</label>
                  <textarea 
                    placeholder="https://..."
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    rows={3}
                    className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none"
                  />
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-xl text-[10px] text-amber-700 font-bold leading-relaxed border border-amber-100">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <span>
                      Use <code className="bg-amber-100/50 px-1 rounded">{"{query}"}</code> for search terms or <code className="bg-amber-100/50 px-1 rounded">{"{url}"}</code> for the offer link.
                    </span>
                  </div>
                </div>
                
                <button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.url || saving}
                  className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 disabled:opacity-30"
                >
                  {saving ? <span className="animate-spin text-xl">◌</span> : <Save size={20} />}
                  {editingLink ? 'Update Configuration' : 'Save New Tool'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
