import { Plane } from 'lucide-react';

interface AirportFiltersProps {
  airportCounts: [string, number][];
  activeSearch: string;
  onSelect: (airport: string) => void;
}

export default function AirportFilters({ airportCounts, activeSearch, onSelect }: AirportFiltersProps) {
  if (airportCounts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-2">Quick Filter:</span>
      <button
        onClick={() => onSelect('')}
        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 ${
          !activeSearch ? 'bg-slate-900 text-white shadow-lg ring-4 ring-slate-900/10' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
        }`}
      >
        All
      </button>
      {airportCounts.map(([airport, count]) => (
        <button
          key={airport}
          onClick={() => onSelect(airport)}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center gap-2 group ${
            activeSearch === airport 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-4 ring-indigo-600/10' 
              : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30'
          }`}
        >
          <Plane size={12} className={activeSearch === airport ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'} />
          {airport}
          <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black transition-colors ${
            activeSearch === airport ? 'bg-indigo-500/50 text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
          }`}>
            {count}
          </span>
        </button>
      ))}
    </div>
  );
}
