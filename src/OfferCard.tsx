import { useState } from 'react';
import {
  MapPin,
  Plane,
  Star,
  Calendar,
  RefreshCcw,
  ChevronRight,
  CheckCircle2,
  X,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TravelOffer } from './types';
import {
  WordpressIcon,
  TelegramIcon,
  FacebookIcon,
  InstagramIcon,
  ExternalLinkIcon,
  AccommodationIcon,
  JsonIcon,
  EditLinkIcon
} from './Icons';

interface OfferCardProps {
  item: TravelOffer;
  idx: number;
  key?: string | number;
  onAirportClick?: (airport: string) => void;
  configLinks?: { id: string, name: string, url: string }[];
}

const formatUrl = (url: string, departureDate: string) => {
  if (!url) return "";
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}room=2_0_0&departuredate=${departureDate || ""}`;
};

export default function OfferCard({ item, idx, onAirportClick, configLinks }: OfferCardProps) {
  const [copied, setCopied] = useState(false);
  const [isLinkPopupOpen, setIsLinkPopupOpen] = useState(false);
  const [editedLink, setEditedLink] = useState(formatUrl(item.link, String(item.departure_date)));
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(item, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: Math.min(idx * 0.05, 1) }}
      className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 flex flex-col h-full"
    >
      {/* Card Header with Destination Info */}
      <div className="p-6 pb-4 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-600 mb-1">
              {item.travel_transportation_type || 'Package'} · {item.airport_departure} Departure
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                {item.accommodation_name || item.title}
              </h3>
              {item.extra_data?.product_acco_url_vd && (
                <a 
                  href={formatUrl(item.extra_data.product_acco_url_vd, item.departure_date)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 bg-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all"
                  title="View Accommodation Details"
                >
                  <AccommodationIcon size={16} />
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0 mt-1">
            <div className="flex items-center gap-0.5 bg-yellow-400/10 text-yellow-600 px-2 py-1 rounded-lg">
              <Star size={14} fill="currentColor" />
              <span className="text-xs font-bold leading-none">{item.star_rating}</span>
            </div>
            {item.extra_data?.product_trustyou_rating && (
              <div className="bg-green-50 text-green-700 px-2 py-1 rounded-lg text-[10px] font-bold leading-none border border-green-100" title="TrustYou Rating">
                {item.extra_data.product_trustyou_rating}/10
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 mb-6">
          <MapPin size={16} className="text-indigo-400 shrink-0" />
          <span className="text-sm font-medium truncate">
            {item.destination_city}, {item.destination_region}
          </span>
          {item.destination_country_code && (
            <img 
              src={`https://flagcdn.com/w40/${item.destination_country_code.toLowerCase()}.png`} 
              alt={item.destination_country}
              className="h-3.5 w-auto rounded-sm shadow-sm border border-slate-100"
              title={item.destination_country}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
            <Calendar size={18} className="text-slate-400" />
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Duration</p>
              <p className="text-sm font-bold text-slate-700 leading-none">
                {item.duration_days}D / {item.duration_nights}N
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-2xl flex items-center gap-3">
            <Plane size={18} className="text-slate-400" />
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Departure</p>
              <button 
                onClick={() => onAirportClick?.(item.airport_departure)}
                className="text-sm font-bold text-slate-700 leading-none truncate hover:text-indigo-600 hover:underline transition-all text-left"
                title={`Filter by ${item.airport_departure}`}
              >
                {item.airport_departure} {item.departure_date && `· ${item.departure_date}`}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-2">
          {item.keywords?.split('-').map((kw, i) => (
            <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md uppercase tracking-wider">
              {kw.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Pricing Footer */}
      <div className="mt-auto p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
        <div>
          {Number(item.price_old) > Number(item.price) && (
            <p className="text-xs text-slate-400 line-through font-medium">
              EUR {item.price_old}
            </p>
          )}
          <div className="flex items-baseline gap-1">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              €{Number(item.price).toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Total</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 justify-end">
          <button
            className="h-10 w-10 bg-sky-50 border border-sky-100 rounded-xl flex items-center justify-center text-sky-700 hover:bg-sky-600 hover:text-white hover:border-sky-600 transition-all duration-300 shrink-0"
            title="Publish to WordPress"
          >
            <WordpressIcon size={18} />
          </button>
          <button
            className="h-10 w-10 bg-cyan-50 border border-cyan-100 rounded-xl flex items-center justify-center text-cyan-600 hover:bg-cyan-500 hover:text-white hover:border-cyan-500 transition-all duration-300 shrink-0"
            title="Publish to Telegram"
          >
            <TelegramIcon size={18} />
          </button>
          <button
            className="h-10 w-10 bg-pink-50 border border-pink-100 rounded-xl flex items-center justify-center text-pink-600 hover:bg-pink-600 hover:text-white hover:border-pink-600 transition-all duration-300 shrink-0"
            title="Publish to Instagram"
          >
            <InstagramIcon size={18} />
          </button>
          <button
            className="h-10 w-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shrink-0"
            title="Publish to Facebook"
          >
            <FacebookIcon size={18} />
          </button>
          <a
            href={formatUrl(item.link, String(item.departure_date))}
            target="_blank"
            rel="noopener noreferrer"
            className="h-10 w-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 shrink-0 ml-1"
            title="Go to Offer"
          >
            <ExternalLinkIcon size={18} />
          </a>
          
          {configLinks?.map(link => (
            <a
              key={link.id}
              href={link.url
                .replace('{query}', encodeURIComponent(item.destination_region || item.destination_city || ''))
                .replace('{url}', encodeURIComponent(formatUrl(item.link, String(item.departure_date))))
              }
              target="_blank"
              rel="noreferrer"
              className="h-10 px-2 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-[9px] font-black text-slate-500 hover:bg-white hover:text-indigo-600 hover:border-indigo-600 transition-all duration-300 min-w-[40px]"
              title={link.name}
            >
              {link.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </a>
          ))}

          <button className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-900 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-300 shrink-0">
            <ChevronRight size={18} />
          </button>
          <button
            onClick={handleCopyJson}
            className={`h-10 w-10 border rounded-xl flex items-center justify-center transition-all duration-300 shrink-0 ${
              copied 
                ? 'bg-green-600 border-green-600 text-white' 
                : 'bg-slate-900 border-slate-900 text-white hover:bg-slate-800'
            }`}
            title="Copy Offer JSON"
          >
            {copied ? <CheckCircle2 size={18} /> : <JsonIcon size={18} />}
          </button>
          <button
            onClick={() => setIsLinkPopupOpen(true)}
            className="h-10 w-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all duration-300 shrink-0"
            title="Edit & Copy Link"
          >
            <EditLinkIcon size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isLinkPopupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLinkPopupOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">Edit Offer Link</h3>
                <button 
                  onClick={() => setIsLinkPopupOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target URL</label>
                  <textarea 
                    value={editedLink}
                    onChange={(e) => setEditedLink(e.target.value)}
                    rows={4}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none resize-none"
                  />
                </div>
                
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(editedLink);
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 2000);
                  }}
                  className={`w-full h-12 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
                    linkCopied 
                      ? 'bg-green-600 text-white shadow-lg shadow-green-100' 
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700'
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle2 size={20} />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Edited Link
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SKU & Meta (Details) */}
      <div className="px-6 py-3 bg-white flex flex-col gap-1 border-t border-slate-50">
        <div className="flex items-center justify-between text-[9px] text-slate-400 tracking-tighter">
          <span className="font-mono truncate max-w-[150px]">
            ID: {item.sku}
          </span>
          <span className="font-medium uppercase">
            Cat: {item.google_category_id || 'Travel'}
          </span>
        </div>
        {item.update_date && (
          <div className="text-[9px] text-slate-400 tracking-tighter flex items-center gap-1 mt-0.5">
            <RefreshCcw size={10} />
            Updated: {item.update_date}
          </div>
        )}
      </div>
    </motion.div>
  );
}
