import { useState, useEffect, useMemo, type ReactNode } from 'react';
import { 
  Search, 
  RefreshCcw,
  Info,
  Database,
  Plane,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Settings,
  FileJson,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, Navigate, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import ApiUrls, { ApiUrl } from './ApiUrls';
import OfferCard from './OfferCard';
import Footer from './Footer';
import AirportFilters from './AirportFilters';
import RegionsPage from './RegionsPage';
import ToolsConfigPage from './ToolsConfigPage';
import JsonDownloaderPage from './JsonDownloaderPage';
import BlankPage from './wp/admin';
import DestinationEditPage from './wp/DestinationEditPage';
import LoginPage from './LoginPage';
import { fetchAdminAuthStatus, logoutAdmin } from './services/adminAuthApi';
import { TravelOffer } from './types';
import { RecentIcon } from './Icons';

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<TravelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortByRecent, setSortByRecent] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 21;
  const [currentTab, setCurrentTab] = useState<'explorer' | 'sources' | 'regions' | 'config' | 'json-downloader'>('explorer');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [checkingAdminAuth, setCheckingAdminAuth] = useState(true);

  const [urls, setUrls] = useState<ApiUrl[]>([]);
  const [selectedUrlId, setSelectedUrlId] = useState<string>('');
  const [configLinks, setConfigLinks] = useState<{ id: string, name: string, url: string }[]>([]);

  const fetchUrls = async () => {
    try {
      const res = await fetch('/api/urls');
      if (res.ok) {
        setUrls(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUrls();
  }, [currentTab]); // Refresh urls when returning from sources tab

  useEffect(() => {
    fetchAdminAuthStatus()
      .then((status) => setAdminAuthenticated(status.authenticated))
      .catch(() => setAdminAuthenticated(false))
      .finally(() => setCheckingAdminAuth(false));
  }, []);

  useEffect(() => {
    fetch('/api/config-links')
      .then(res => res.json())
      .then(data => setConfigLinks(data));
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedUrlId]);

  useEffect(() => {
    async function fetchData() {
      if (!selectedUrlId) {
        setData([]);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const urlParam = selectedUrlId ? `?urlId=${selectedUrlId}` : '';
        const response = await fetch(`/api/feed${urlParam}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const result = await response.json();
        // Extract the products array from various possible Daisycon structures
        let items: any[] = [];
        if (Array.isArray(result)) {
          items = result;
        } else if (result.datafeed?.programs?.[0]?.products) {
          items = result.datafeed.programs[0].products;
        } else if (result.products) {
          items = result.products;
        } else if (result.items) {
          items = result.items;
        }
        
        // Normalize: If the item has a 'product_info' property, flatten it out
        const normalizedItems = items.map(item => {
          if (item.product_info) {
            return { ...item.update_info, ...item.product_info };
          }
          return item;
        });

        setData(normalizedItems);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedUrlId]);

  const filteredData = useMemo(() => {
    let result = data;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(item => 
        item.title?.toLowerCase().includes(s) || 
        item.destination_city?.toLowerCase().includes(s) ||
        item.accommodation_name?.toLowerCase().includes(s) ||
        item.airport_departure?.toLowerCase().includes(s)
      );
    }

    if (sortByRecent) {
      result = [...result].sort((a, b) => {
        if (!a.update_date) return 1;
        if (!b.update_date) return -1;
        return new Date(b.update_date).getTime() - new Date(a.update_date).getTime();
      });
    }

    return result;
  }, [data, search, sortByRecent]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const isWpRoute = location.pathname.startsWith('/wp');
  const isLoginRoute = location.pathname.startsWith('/login');
  const showFeedActions =
    !isWpRoute && !isLoginRoute && !['sources', 'json-downloader'].includes(currentTab);
  const isLocalhost =
    typeof window !== 'undefined' &&
    ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);

  const handleAdminLogout = async () => {
    await logoutAdmin();
    setAdminAuthenticated(false);
    navigate('/login', { replace: true });
  };

  const requireAdmin = (element: ReactNode) => {
    if (checkingAdminAuth) {
      return (
        <main className="min-h-[calc(100vh-5rem)] flex items-center justify-center">
          <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
        </main>
      );
    }

    if (isLocalhost) {
      return element;
    }

    if (!adminAuthenticated) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return element;
  };

  const requireAppLogin = (element: ReactNode) => {
    if (isLocalhost || isLoginRoute) {
      return element;
    }

    if (checkingAdminAuth) {
      return (
        <main className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" />
        </main>
      );
    }

    if (!adminAuthenticated) {
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return element;
  };

  const selectTab = (tab: typeof currentTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    if (isWpRoute) {
      navigate('/');
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const airportCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(item => {
      if (item.airport_departure) {
        counts[item.airport_departure] = (counts[item.airport_departure] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Info size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Fetch Error</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCcw size={18} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const appHeader = (
    <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <Plane size={24} />
          </div>
          <div className="flex items-center gap-2">
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none">Daisycon Explorer</h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Real-time Datafeed Feed</p>
            </div>
            <svg viewBox="0 0 24 24" width="20" height="20" className="text-slate-500" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.03 3.173c.39.09.834.21 1.31.36l-1.027 3.334-.39-1.25-.015-.048-.33-1.057a1.3 1.3 0 0 0-.992-.742l-.316-.04-.343-.044h-.007c-.063 0-.13.007-.206.02l-1.245.296-1.231 3.254-.478 1.265-.497-1.28-1.231-3.247-1.244-.294a2.16 2.16 0 0 0-.238-.038l-.016-.002c-.189-.03-.367-.04-.53-.026l-.015.002-.54.076c-.198.03-.393.12-.565.26a1.5 1.5 0 0 0-.61.92l-.146.57-1.11 2.934a.63.63 0 1 0 1.175.434l.842-2.228 3.291 8.704a.63.63 0 0 0 1.164.008l3.2-8.486.842 2.237a.63.63 0 1 0 1.18-.443Zm-4.355 1.2 1.847 4.888-1.163-3.008-1.262-3.4Zm7.65 0-.001.002-1.262 3.4-1.163 3.008 1.846-4.89Zm-1.752 7.797c.787 0 1.54-.332 2.06-.866l-1.092-2.89-.868 2.304a.63.63 0 0 1-1.164-.008L8.95 9.292 7.856 12.7a8.269 8.269 0 0 0 5.657 1.47Z"/>
            </svg>
          </div>
        </div>

        <div className="hidden md:flex bg-slate-100 p-1 rounded-xl mx-4">
          <button
            onClick={() => selectTab('explorer')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${!isWpRoute && currentTab === 'explorer' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Feed Explorer
          </button>
          <button
            onClick={() => selectTab('sources')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${!isWpRoute && currentTab === 'sources' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Database size={16} />
            Data Sources
          </button>
          <button
            onClick={() => selectTab('regions')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${!isWpRoute && currentTab === 'regions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MapPin size={16} />
            Regions
          </button>
          <button
            onClick={() => selectTab('config')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${!isWpRoute && currentTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Settings size={16} />
            Tools
          </button>
          <button
            onClick={() => selectTab('json-downloader')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${!isWpRoute && currentTab === 'json-downloader' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileJson size={16} />
            JSON
          </button>
          <Link
            to="/wp"
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 ${isWpRoute ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Shield size={16} />
            Admin
          </Link>
        </div>

        <div className={`relative max-w-sm w-full ml-auto hidden sm:block ${isWpRoute || isLoginRoute || currentTab === 'sources' ? 'opacity-0 pointer-events-none' : ''}`}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search destination, hotel, or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-12 pr-4 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-2xl transition-all outline-none text-sm"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="md:hidden h-10 w-10 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 flex items-center justify-center transition-colors"
            aria-label="Open navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          {showFeedActions && (
            <>
              <button
                onClick={() => setSortByRecent(!sortByRecent)}
                className={`h-10 px-3 rounded-xl flex items-center gap-2 text-sm font-semibold transition-all border ${
                  sortByRecent
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-inner'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
                title="Sort by recently updated"
              >
                <RecentIcon size={16} />
                <span className="hidden sm:inline">Recent</span>
              </button>
              <div className="px-3 py-1.5 bg-slate-100 rounded-full text-xs font-semibold text-slate-600 whitespace-nowrap">
                {loading ? '---' : filteredData.length} Results
              </div>
            </>
          )}
        </div>
      </div>
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-slate-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-2 gap-2">
            <button
              onClick={() => selectTab('explorer')}
              className={`h-11 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                !isWpRoute && currentTab === 'explorer'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Plane size={16} />
              Feed
            </button>
            <button
              onClick={() => selectTab('sources')}
              className={`h-11 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                !isWpRoute && currentTab === 'sources'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Database size={16} />
              Sources
            </button>
            <button
              onClick={() => selectTab('regions')}
              className={`h-11 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                !isWpRoute && currentTab === 'regions'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin size={16} />
              Regions
            </button>
            <button
              onClick={() => selectTab('config')}
              className={`h-11 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                !isWpRoute && currentTab === 'config'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Settings size={16} />
              Tools
            </button>
            <button
              onClick={() => selectTab('json-downloader')}
              className={`h-11 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                !isWpRoute && currentTab === 'json-downloader'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileJson size={16} />
              JSON
            </button>
            <Link
              to="/wp"
              onClick={() => setMobileMenuOpen(false)}
              className={`h-11 px-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                isWpRoute
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Shield size={16} />
              Admin
            </Link>
          </div>
        </nav>
      )}
    </header>
  );

  return requireAppLogin(
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {!isLoginRoute && appHeader}
      <Routes>
      <Route
        path="/login"
        element={
          <LoginPage
            authenticated={adminAuthenticated}
            onLogin={() => setAdminAuthenticated(true)}
          />
        }
      />
      <Route
        path="/wp/destinations/:destinationId/edit"
        element={requireAdmin(<DestinationEditPage />)}
      />
      <Route
        path="/wp"
        element={requireAdmin(<BlankPage onLogout={handleAdminLogout} />)}
      />
      <Route path="*" element={
        <>
          {currentTab === 'sources' ? (
            <ApiUrls />
          ) : currentTab === 'regions' ? (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <RegionsPage data={data} />
            </main>
          ) : currentTab === 'config' ? (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <ToolsConfigPage />
            </main>
          ) : currentTab === 'json-downloader' ? (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
              <JsonDownloaderPage />
            </main>
          ) : (
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          {/* Mobile Search */}
          <div className="sm:hidden mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-2xl transition-all outline-none text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Database size={20} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Active Data Source</h2>
                <p className="text-xs text-slate-500">Select which feed to browse</p>
              </div>
            </div>
            <select
              value={selectedUrlId}
              onChange={(e) => setSelectedUrlId(e.target.value)}
              className="w-full sm:w-auto min-w-[200px] h-11 bg-slate-50 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl px-4 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer"
            >
              <option value="" disabled>-- Select a Data Source --</option>
              {urls.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>

          {!loading && selectedUrlId && (
            <AirportFilters 
              airportCounts={airportCounts} 
              activeSearch={search} 
              onSelect={setSearch} 
            />
          )}

        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl h-[400px] animate-pulse border border-slate-100">
                  <div className="h-48 bg-slate-100 rounded-t-2xl mb-4" />
                  <div className="px-6 space-y-3">
                    <div className="h-6 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-4 bg-slate-100 rounded w-full" />
                    <div className="h-12 bg-slate-100 rounded-xl mt-6" />
                  </div>
                </div>
              ))}
            </div>
          ) : !selectedUrlId ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 shadow-inner">
                <Database size={48} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Select a Data Source</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-3 font-medium leading-relaxed">
                Choose an API endpoint from the dropdown above to load and explore travel offers.
              </p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-4">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">No results found</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2">
                We couldn't find anything matching "{search}". Try another keyword.
              </p>
              <button 
                onClick={() => setSearch('')}
                className="mt-6 text-indigo-600 font-semibold hover:text-indigo-700 underline underline-offset-4"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {paginatedData.map((item, idx) => (
                <OfferCard 
                  key={item.sku || idx} 
                  item={item} 
                  idx={idx} 
                  configLinks={configLinks}
                  onAirportClick={(airport) => setSearch(airport)}
                />
              ))}
            </motion.div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-12 flex flex-col items-center gap-6 pb-12">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Only show first, last, and pages around current
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-10 min-w-[40px] px-3 rounded-xl text-sm font-bold transition-all ${
                            currentPage === page 
                              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                              : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-900'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 || 
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-1 text-slate-400">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
              
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}
        </AnimatePresence>
      </main>
      )}

          <Footer />
        </>
      } />
    </Routes>
    </div>,
  );
}
