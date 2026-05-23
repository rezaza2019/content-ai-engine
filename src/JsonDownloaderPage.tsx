import { useState, useEffect } from 'react';
import { Download, FileJson, Search, Database, ArrowRight, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiUrl } from './ApiUrls';

export default function JsonDownloaderPage() {
  const [urls, setUrls] = useState<ApiUrl[]>([]);
  const [selectedUrlId, setSelectedUrlId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/urls')
      .then(res => res.json())
      .then(setUrls)
      .catch(err => console.error('Failed to load URLs:', err));
  }, []);

  const handleFetch = async () => {
    if (!selectedUrlId) return;

    setLoading(true);
    setStatus('fetching');
    setError(null);
    setData(null);

    try {
      const response = await fetch(`/api/feed?urlId=${selectedUrlId}`);
      if (!response.ok) throw new Error('Failed to fetch JSON feed');
      
      const json = await response.json();
      setData(json);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    const sourceName = urls.find(u => u.id === selectedUrlId)?.name || 'feed';
    const fileName = `${sourceName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStats = () => {
    if (!data) return null;
    
    let items: any[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data.datafeed?.programs?.[0]?.products) {
      items = data.datafeed.programs[0].products;
    } else if (data.products) {
      items = data.products;
    } else if (data.items) {
      items = data.items;
    }

    const size = new Blob([JSON.stringify(data)]).size;
    const sizeMB = (size / (1024 * 1024)).toFixed(2);

    return {
      count: items.length,
      size: sizeMB,
      timestamp: new Date().toLocaleString()
    };
  };

  const stats = getStats();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 shadow-sm mb-2">
          <FileJson size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">JSON Downloader</h1>
        <p className="text-slate-500 max-w-lg mx-auto font-medium">
          Extract and download raw JSON data from your Daisycon datafeeds for local analysis or integration.
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Select Data Source</label>
              <div className="relative">
                <Database className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedUrlId}
                  onChange={(e) => setSelectedUrlId(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-white border border-slate-200 text-slate-700 text-sm font-semibold rounded-2xl outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all cursor-pointer appearance-none"
                >
                  <option value="" disabled>-- Choose a feed source --</option>
                  {urls.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <button
              onClick={handleFetch}
              disabled={!selectedUrlId || loading}
              className="h-14 px-8 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-200"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
              Fetch Feed Data
            </button>
          </div>
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                  <ArrowRight size={40} />
                </div>
                <h3 className="text-lg font-bold text-slate-400">Ready to fetch</h3>
                <p className="text-slate-400 text-sm max-w-xs mt-1">Select a data source above to begin the extraction process.</p>
              </motion.div>
            )}

            {status === 'fetching' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin" />
                  <FileJson className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mt-6">Processing Feed...</h3>
                <p className="text-slate-500 text-sm mt-1">This might take a few seconds depending on the feed size.</p>
              </motion.div>
            )}

            {status === 'error' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-100 rounded-2xl p-8 flex flex-col items-center text-center"
              >
                <AlertCircle className="text-red-500 mb-4" size={48} />
                <h3 className="text-lg font-bold text-red-900">Extraction Failed</h3>
                <p className="text-red-600 mt-2 font-medium">{error}</p>
                <button 
                  onClick={handleFetch}
                  className="mt-6 px-6 py-2 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
              </motion.div>
            )}

            {status === 'success' && data && stats && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl">
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Products Found</p>
                    <p className="text-3xl font-black text-emerald-900">{stats.count.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                    <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">File Size</p>
                    <p className="text-3xl font-black text-blue-900">{stats.size} MB</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl">
                    <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-amber-600" size={24} />
                      <p className="text-xl font-black text-amber-900">Ready</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <FileJson size={20} className="text-amber-500" />
                      JSON Preview (First 500 characters)
                    </h3>
                    <span className="text-xs font-medium text-slate-400">Fetched at {stats.timestamp}</span>
                  </div>
                  <div className="relative group">
                    <pre className="bg-slate-900 text-slate-300 p-6 rounded-2xl overflow-x-auto text-xs font-mono leading-relaxed max-h-[300px]">
                      {JSON.stringify(data, null, 2).slice(0, 500)}...
                    </pre>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none rounded-2xl" />
                  </div>
                </div>

                <button
                  onClick={handleDownload}
                  className="w-full h-16 bg-emerald-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-100 active:scale-[0.98]"
                >
                  <Download size={24} />
                  Download Full JSON File
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Info Tips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-3xl">
          <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <CheckCircle2 size={18} />
            Why download?
          </h4>
          <p className="text-sm text-indigo-700/80 leading-relaxed font-medium">
            Downloading the raw feed allows you to perform custom data processing, import data into Excel/Google Sheets, or audit the content without active internet connections.
          </p>
        </div>
        <div className="p-6 bg-slate-100/50 border border-slate-200 rounded-3xl">
          <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Feed Structure
          </h4>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            This tool automatically detects common Daisycon data structures (products, datafeed.programs, items) to provide accurate statistics and preview.
          </p>
        </div>
      </div>
    </div>
  );
}
