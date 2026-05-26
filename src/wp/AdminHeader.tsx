import {
  Braces,
  CircleDollarSign,
  Hotel,
  Link2,
  MapPinned,
  Plane,
  Plus,
  Tags,
  Zap,
} from "lucide-react";
import { translations } from "./translations";

export type AdminTab =
  | "destinations"
  | "tickets"
  | "deals"
  | "accommodations"
  | "travelOffers";

type AdminHeaderProps = {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onAddNew: () => void;
  onSmartImport: () => void;
  onAccommodationJsonImport: () => void;
  onTravelOfferUrlImport?: () => void;
};

export default function AdminHeader({
  activeTab,
  onTabChange,
  onAddNew,
  onSmartImport,
  onAccommodationJsonImport,
  onTravelOfferUrlImport,
}: AdminHeaderProps) {
  const t = translations.en;
  const tabs: Array<{
    id: AdminTab;
    label: string;
    icon: typeof MapPinned;
  }> = [
    { id: "destinations", label: t.tabDestinations, icon: MapPinned },
    { id: "accommodations", label: t.tabAccommodations, icon: Hotel },
    { id: "travelOffers", label: t.tabTravelOffers, icon: Tags },
    { id: "tickets", label: t.tabTickets, icon: Plane },
    { id: "deals", label: t.tabDeals, icon: CircleDollarSign },
  ];

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
      <div className="w-full text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          {t.title}
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3 bg-white/70 border border-slate-200 rounded-3xl p-3 shadow-sm">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={`group min-h-[72px] rounded-2xl px-3 py-3 text-left transition-all border ${
                  isActive
                    ? "bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200"
                    : "bg-slate-50 text-slate-500 border-transparent hover:bg-white hover:border-slate-200 hover:text-slate-900"
                }`}
              >
                <span
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-xl transition-colors ${
                    isActive
                      ? "bg-white/15 text-white"
                      : "bg-white text-slate-400 group-hover:text-indigo-600"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="block text-sm font-black leading-tight">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4">
        {activeTab === "destinations" && (
          <>
            <button
              type="button"
              onClick={onSmartImport}
              className="group flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Zap className="w-5 h-5 text-amber-500" />
              {t.smartImport}
            </button>

            <button
              type="button"
              onClick={onAddNew}
              className="group flex items-center gap-2 bg-gradient-to-r from-sky-600 to-blue-700 text-white px-8 py-3 rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-sky-100"
            >
              <div className="bg-white/20 p-1 rounded-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              {t.addNew}
            </button>
          </>
        )}
        {activeTab === "accommodations" && (
          <button
            type="button"
            onClick={onAccommodationJsonImport}
            className="group flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Braces className="w-5 h-5 text-sky-500" />
            {t.accommodationJsonImport}
          </button>
        )}
        {activeTab === "travelOffers" && onTravelOfferUrlImport && (
          <button
            type="button"
            onClick={onTravelOfferUrlImport}
            className="group flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-2xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
          >
            <Link2 className="w-5 h-5 text-indigo-600" />
            Create from URL
          </button>
        )}
      </div>
    </div>
  );
}
