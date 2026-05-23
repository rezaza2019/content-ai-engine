import { useState, useEffect, useMemo } from 'react';
import { MapPin, Globe, Image as ImageIcon, Download, Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { TravelOffer } from './types';

interface RegionsPageProps {
  data: TravelOffer[];
}

export default function RegionsPage({ data }: RegionsPageProps) {
  const [regionImages, setRegionImages] = useState<Record<string, string[]>>({});
  const [downloading, setDownloading] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, { type: 'success' | 'error', msg: string }>>({});

  const fetchImages = async () => {
    try {
      const res = await fetch('/api/regions/images');
      if (res.ok) {
        setRegionImages(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const regions = useMemo(() => {
    const map = new Map<string, { country: string; countryCode: string; region: string }>();
    data.forEach(item => {
      if (item.destination_region && item.destination_country) {
        const key = `${item.destination_country}-${item.destination_region}`;
        if (!map.has(key)) {
          map.set(key, {
            country: item.destination_country,
            countryCode: item.destination_country_code,
            region: item.destination_region
          });
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.country.localeCompare(b.country) || a.region.localeCompare(b.region));
  }, [data]);

  const handleDownload = async (country: string, region: string) => {
    const url = imageUrl[region];
    if (!url) return;

    setDownloading(region);
    setStatus({ ...status, [region]: undefined as any });

    try {
      const res = await fetch('/api/regions/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: url, countryName: country, regionName: region })
      });

      if (res.ok) {
        setStatus({ ...status, [region]: { type: 'success', msg: 'Image saved!' } });
        fetchImages();
        setImageUrl({ ...imageUrl, [region]: '' });
      } else {
        setStatus({ ...status, [region]: { type: 'error', msg: 'Failed to download' } });
      }
    } catch (err) {
      setStatus({ ...status, [region]: { type: 'error', msg: 'Network error' } });
    } finally {
      setDownloading(null);
    }
  };

  const handleUpload = async (country: string, region: string, file: File) => {
    if (!file) return;

    setDownloading(region);
    setStatus({ ...status, [region]: undefined as any });

    const formData = new FormData();
    formData.append('image', file);
    formData.append('countryName', country);
    formData.append('regionName', region);

    try {
      const res = await fetch('/api/regions/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setStatus({ ...status, [region]: { type: 'success', msg: 'Image uploaded!' } });
        fetchImages();
      } else {
        setStatus({ ...status, [region]: { type: 'error', msg: 'Upload failed' } });
      }
    } catch (err) {
      setStatus({ ...status, [region]: { type: 'error', msg: 'Network error' } });
    } finally {
      setDownloading(null);
    }
  };

  const hasImage = (country: string, region: string) => {
    const countryImages = regionImages[country] || [];
    const fileName = `${region.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    return countryImages.includes(fileName);
  };

  const getImagePath = (country: string, region: string) => {
    const fileName = `${region.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
    return `/images/regions/${country}/${fileName}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Region Explorer</h2>
          <p className="text-slate-500 font-medium">Manage and view images for travel regions</p>
        </div>
        <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100 flex items-center gap-3">
          <Globe className="text-indigo-600" size={20} />
          <span className="text-sm font-bold text-indigo-700">{regions.length} Unique Regions</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {regions.map((reg, idx) => (
          <motion.div
            key={`${reg.country}-${reg.region}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="h-48 bg-slate-100 relative group overflow-hidden">
              {hasImage(reg.country, reg.region) ? (
                <img 
                  src={getImagePath(reg.country, reg.region)} 
                  alt={reg.region}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                  <ImageIcon size={40} strokeWidth={1.5} />
                  <span className="text-xs font-bold uppercase tracking-wider">No Image Set</span>
                </div>
              )}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full shadow-sm flex items-center gap-2">
                  {reg.countryCode && (
                    <img 
                      src={`https://flagcdn.com/w20/${reg.countryCode.toLowerCase()}.png`} 
                      className="h-3 w-auto"
                      alt={reg.country}
                    />
                  )}
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{reg.country}</span>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="text-indigo-500" size={18} />
                <h3 className="text-lg font-bold text-slate-900">{reg.region}</h3>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Enter Image URL..."
                    value={imageUrl[reg.region] || ''}
                    onChange={(e) => setImageUrl({ ...imageUrl, [reg.region]: e.target.value })}
                    className="flex-1 h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                  />
                  <button 
                    disabled={!imageUrl[reg.region] || downloading === reg.region}
                    onClick={() => handleDownload(reg.country, reg.region)}
                    className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    title="Download from URL"
                  >
                    {downloading === reg.region ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                  </button>
                  <label className="h-10 w-10 bg-slate-800 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 transition-colors cursor-pointer shadow-sm" title="Upload local file">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(reg.country, reg.region, file);
                      }}
                    />
                    <Upload size={18} />
                  </label>
                </div>

                {status[reg.region] && (
                  <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-lg ${
                    status[reg.region].type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {status[reg.region].type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                    {status[reg.region].msg}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
