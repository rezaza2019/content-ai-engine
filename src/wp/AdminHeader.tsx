import { Plus, Zap } from "lucide-react";
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
};

export default function AdminHeader({
  activeTab,
  onTabChange,
  onAddNew,
  onSmartImport,
}: AdminHeaderProps) {
  const t = translations.en;

  return (
    <div className="flex flex-col lg:flex-row justify-between items-center mb-10 gap-6">
      <div className="text-center lg:text-left">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          {t.title}
        </h1>

        <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl mt-4 gap-1">
          <button
            type="button"
            onClick={() => onTabChange("destinations")}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === "destinations"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.tabDestinations}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("accommodations")}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === "accommodations"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.tabAccommodations}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("travelOffers")}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === "travelOffers"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.tabTravelOffers}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("tickets")}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === "tickets"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.tabTickets}
          </button>
          <button
            type="button"
            onClick={() => onTabChange("deals")}
            className={`px-6 py-2 rounded-xl text-sm font-black transition-all ${
              activeTab === "deals"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.tabDeals}
          </button>
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
      </div>
    </div>
  );
}
