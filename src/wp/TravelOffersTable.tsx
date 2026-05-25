import { Edit, ExternalLink, Globe, Plane, Trash2 } from "lucide-react";
import { RenderedText } from "../types/destination";
import { TravelOffer } from "../types/travelOffer";
import { translations } from "./translations";

type TravelOffersTableProps = {
  offers: TravelOffer[];
  deletingOfferId?: string | number | null;
  onDelete: (offer: TravelOffer) => void;
};

const getPlainTitle = (title?: RenderedText | string) => {
  if (!title) return "";
  if (typeof title === "string") return title.replace(/<[^>]*>/g, "");
  return title.rendered?.replace(/<[^>]*>/g, "") || "";
};

export default function TravelOffersTable({
  offers,
  deletingOfferId,
  onDelete,
}: TravelOffersTableProps) {
  const t = translations.en;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Offer
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.price}
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.duration}
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.departure}
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
            {offers.map((offer) => {
              const displayName =
                getPlainTitle(offer.title) || "Untitled travel offer";

              return (
                <tr
                  key={offer.id}
                  className="group hover:bg-slate-50/80 transition-all duration-300"
                >
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-16 w-16 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        {offer.imageUrl ? (
                          <img
                            className="h-full w-full object-cover"
                            src={offer.imageUrl}
                            alt=""
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <Plane className="w-8 h-8 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className="ml-6">
                        <div className="text-lg font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {displayName}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                          #{offer.id} - {offer.slug}
                        </div>
                        {offer.departure_airport ? (
                          <div className="text-xs text-slate-500 font-semibold mt-1">
                            {offer.departure_airport}
                            {offer.board_type ? ` · ${offer.board_type}` : ""}
                          </div>
                        ) : null}
                        <div className="mt-3 flex items-center gap-2 xl:hidden">
                          {offer.admin_edit_link ? (
                            <a
                              href={offer.admin_edit_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                              title="Edit in WordPress"
                              aria-label={`Edit travel offer ${offer.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onDelete(offer)}
                            disabled={deletingOfferId === offer.id}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 disabled:opacity-60"
                            title="Delete"
                            aria-label={`Delete travel offer ${offer.id}`}
                          >
                            {deletingOfferId === offer.id ? (
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
                    <span className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl inline-flex w-fit font-black shadow-sm shadow-indigo-100/50">
                      {offer.price_per_person_from
                        ? `${offer.price_per_person_from} EUR`
                        : "-"}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-slate-700 font-bold">
                      {offer.duration_days
                        ? `${offer.duration_days} ${t.days}`
                        : "-"}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-slate-700 font-bold">
                      {offer.departure_date || "-"}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200/60 w-fit">
                      {offer.status || "-"}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex justify-center items-center gap-2">
                      {offer.admin_edit_link ? (
                        <a
                          href={offer.admin_edit_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all duration-300"
                          title="Edit in WordPress"
                          aria-label={`Edit travel offer ${offer.id}`}
                        >
                          <Edit className="w-5 h-5" />
                        </a>
                      ) : null}
                      {offer.affiliate_link ? (
                        <a
                          href={offer.affiliate_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-2xl transition-all duration-300"
                          title="Open affiliate link"
                          aria-label={`Open affiliate link for travel offer ${offer.id}`}
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      ) : null}
                      {offer.link ? (
                        <a
                          href={offer.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all duration-300"
                          title="Open travel offer in WordPress"
                          aria-label={`Open travel offer ${offer.id} in WordPress`}
                        >
                          <Globe className="w-5 h-5" />
                        </a>
                      ) : !offer.affiliate_link ? (
                        <Globe className="w-5 h-5 text-slate-200" />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => onDelete(offer)}
                        disabled={deletingOfferId === offer.id}
                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 disabled:opacity-60"
                        title="Delete"
                        aria-label={`Delete travel offer ${offer.id}`}
                      >
                        {deletingOfferId === offer.id ? (
                          <div className="h-5 w-5 rounded-full border-2 border-rose-300 border-t-transparent animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {offers.length === 0 && (
        <div className="text-center py-20 bg-slate-50/50">
          <div className="bg-white inline-flex p-6 rounded-full shadow-lg shadow-slate-100 mb-6">
            <Plane className="w-12 h-12 text-slate-200" />
          </div>
          <p className="text-slate-400 text-xl font-bold">{t.noTravelOffers}</p>
        </div>
      )}
    </div>
  );
}
