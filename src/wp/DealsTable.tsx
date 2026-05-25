import { Edit, ExternalLink, Gift, Globe, Trash2 } from "lucide-react";
import { Deal } from "../types/deal";
import { translations } from "./translations";

type DealsTableProps = {
  deals: Deal[];
  deletingDealId?: string | number | null;
  onDelete: (deal: Deal) => void;
};

export default function DealsTable({
  deals,
  deletingDealId,
  onDelete,
}: DealsTableProps) {
  const t = translations.en;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Deal
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Price
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Where to Buy
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Status
              </th>
              <th className="px-8 py-6 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {deals.map((deal) => (
              <tr
                key={deal.id}
                className="group hover:bg-slate-50/80 transition-all duration-300"
              >
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      {deal.imageUrl ? (
                        <img
                          className="h-full w-full object-cover"
                          src={deal.imageUrl}
                          alt=""
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <Gift className="w-8 h-8 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="ml-6">
                      <div
                        className="text-lg font-extrabold text-slate-900 group-hover:text-emerald-600 transition-colors"
                        dangerouslySetInnerHTML={{
                          __html:
                            deal.name ||
                            deal.title?.rendered ||
                            "Untitled deal",
                        }}
                      />
                      <div className="text-sm text-slate-400 font-medium">
                        #{deal.id} - {deal.slug}
                      </div>
                      <div className="mt-3 flex items-center gap-2 xl:hidden">
                        {deal.admin_edit_link ? (
                          <a
                            href={deal.admin_edit_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                            title="Edit in WordPress"
                            aria-label={`Edit deal ${deal.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </a>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => onDelete(deal)}
                          disabled={deletingDealId === deal.id}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 disabled:opacity-60"
                          title="Delete"
                          aria-label={`Delete deal ${deal.id}`}
                        >
                          {deletingDealId === deal.id ? (
                            <div className="h-4 w-4 rounded-full border-2 border-rose-300 border-t-transparent animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex flex-col gap-1">
                    <span className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl inline-flex w-fit font-black shadow-sm shadow-emerald-100/50">
                      {deal.discounted_price
                        ? `${deal.discounted_price} EUR`
                        : "-"}
                    </span>
                    {deal.old_price && (
                      <span className="text-xs text-slate-400 line-through font-bold ml-1">
                        {deal.old_price} EUR
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-slate-700 font-bold">
                    {deal.where_to_buy || "-"}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200/60 w-fit">
                    {deal.status || "-"}
                  </span>
                </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex justify-center items-center gap-2">
                      {deal.admin_edit_link ? (
                        <a
                          href={deal.admin_edit_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all duration-300"
                          title="Edit in WordPress"
                          aria-label={`Edit deal ${deal.id}`}
                        >
                          <Edit className="w-5 h-5" />
                        </a>
                      ) : null}
                      {deal.link ? (
                      <a
                        href={deal.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all duration-300"
                        title="Open Deal"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      ) : (
                        <Globe className="w-5 h-5 text-slate-200" />
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(deal)}
                        disabled={deletingDealId === deal.id}
                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 disabled:opacity-60"
                        title="Delete"
                        aria-label={`Delete deal ${deal.id}`}
                      >
                        {deletingDealId === deal.id ? (
                          <div className="h-5 w-5 rounded-full border-2 border-rose-300 border-t-transparent animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {deals.length === 0 && (
        <div className="text-center py-20 bg-slate-50/50">
          <div className="bg-white inline-flex p-6 rounded-full shadow-lg shadow-slate-100 mb-6">
            <Gift className="w-12 h-12 text-slate-200" />
          </div>
          <p className="text-slate-400 text-xl font-bold">{t.noDeals}</p>
        </div>
      )}
    </div>
  );
}
