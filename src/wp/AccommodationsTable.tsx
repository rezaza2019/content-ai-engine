import { Building2, Edit, ExternalLink, Globe, Trash2 } from "lucide-react";
import { Accommodation } from "../types/accommodation";
import { RenderedText } from "../types/destination";
import { translations } from "./translations";

type AccommodationsTableProps = {
  accommodations: Accommodation[];
  deletingAccommodationId?: string | number | null;
  onDelete: (accommodation: Accommodation) => void;
};

const getPlainTitle = (title?: RenderedText | string) => {
  if (!title) return "";
  if (typeof title === "string") return title.replace(/<[^>]*>/g, "");
  return title.rendered?.replace(/<[^>]*>/g, "") || "";
};

export default function AccommodationsTable({
  accommodations,
  deletingAccommodationId,
  onDelete,
}: AccommodationsTableProps) {
  const t = translations.en;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Accommodation
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Location
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Rating
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
            {accommodations.map((item) => {
              const displayName =
                item.name ||
                getPlainTitle(item.title) ||
                "Untitled accommodation";
              const location = [item.city, item.region, item.country]
                .filter(Boolean)
                .join(", ");

              return (
                <tr
                  key={item.id}
                  className="group hover:bg-slate-50/80 transition-all duration-300"
                >
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-16 w-16 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                        {item.imageUrl ? (
                          <img
                            className="h-full w-full object-cover"
                            src={item.imageUrl}
                            alt=""
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <Building2 className="w-8 h-8 opacity-30" />
                          </div>
                        )}
                      </div>
                      <div className="ml-6">
                        <div className="text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {displayName}
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                          #{item.id} - {item.slug}
                        </div>
                        <div className="mt-3 flex items-center gap-2 xl:hidden">
                          {item.admin_edit_link ? (
                            <a
                              href={item.admin_edit_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                              title="Edit in WordPress"
                              aria-label={`Edit accommodation ${item.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </a>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onDelete(item)}
                            disabled={deletingAccommodationId === item.id}
                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 disabled:opacity-60"
                            title="Delete"
                            aria-label={`Delete accommodation ${item.id}`}
                          >
                            {deletingAccommodationId === item.id ? (
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
                    <div className="text-slate-700 font-bold">
                      {location || "-"}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {item.rating ? (
                        <span className="bg-sky-50 text-sky-700 px-4 py-2 rounded-xl inline-flex w-fit font-black shadow-sm shadow-sky-100/50">
                          {item.rating}/10
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                      {item.review_count ? (
                        <span className="text-xs text-slate-400 font-bold ml-1">
                          {item.review_count} reviews
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200/60 w-fit">
                      {item.status || "-"}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex justify-center items-center gap-2">
                      {item.admin_edit_link ? (
                        <a
                          href={item.admin_edit_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all duration-300"
                          title="Edit in WordPress"
                        >
                          <Edit className="w-5 h-5" />
                        </a>
                      ) : null}
                      {item.link ? (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-2xl transition-all duration-300"
                          title="Open accommodation"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </a>
                      ) : (
                        <Globe className="w-5 h-5 text-slate-200" />
                      )}
                      <button
                        type="button"
                        onClick={() => onDelete(item)}
                        disabled={deletingAccommodationId === item.id}
                        className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 disabled:opacity-60"
                        title="Delete"
                        aria-label={`Delete accommodation ${item.id}`}
                      >
                        {deletingAccommodationId === item.id ? (
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

      {accommodations.length === 0 && (
        <div className="text-center py-20 bg-slate-50/50">
          <div className="bg-white inline-flex p-6 rounded-full shadow-lg shadow-slate-100 mb-6">
            <Building2 className="w-12 h-12 text-slate-200" />
          </div>
          <p className="text-slate-400 text-xl font-bold">{t.noAccommodations}</p>
        </div>
      )}
    </div>
  );
}
