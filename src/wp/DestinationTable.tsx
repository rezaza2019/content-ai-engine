import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit,
  Eye,
  Globe,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Destination } from "../types/destination";
import { translations } from "./translations";

type DestinationTableProps = {
  destinations: Destination[];
  deletingDestinationId?: string | number | null;
  onDelete: (destination: Destination) => void;
};

export default function DestinationTable({
  destinations,
  deletingDestinationId,
  onDelete,
}: DestinationTableProps) {
  const t = translations.en;
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(destinations.length / pageSize));

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedDestinations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return destinations.slice(start, start + pageSize);
  }, [currentPage, destinations]);

  const firstRecord = destinations.length === 0
    ? 0
    : (currentPage - 1) * pageSize + 1;
  const lastRecord = Math.min(currentPage * pageSize, destinations.length);
  const staleAfterDays = 3;
  const formatDate = (value?: string) => {
    if (!value) return "-";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };
  const isStale = (value?: string) => {
    if (!value) return true;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;

    const ageMs = Date.now() - date.getTime();
    return ageMs > staleAfterDays * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.destination}
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.region}
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.country}
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.typeOfDestination}
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.updated}
              </th>
              <th className="px-8 py-6 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedDestinations.map((destination) => (
              <tr
                key={destination.id}
                className="group hover:bg-slate-50/80 transition-all duration-300"
              >
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      {destination.imageUrl ? (
                        <img
                          className="h-full w-full object-cover"
                          src={destination.imageUrl}
                          alt=""
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <Globe className="w-8 h-8 opacity-20" />
                        </div>
                      )}
                    </div>
                    <div className="ml-6">
                      <div
                        className="text-lg font-extrabold text-slate-900 group-hover:text-sky-600 transition-colors"
                        dangerouslySetInnerHTML={{
                          __html:
                            destination.destination_name ||
                            destination.title?.rendered ||
                            "",
                        }}
                      />
                      <div className="text-sm text-slate-400 font-medium">
                        #{destination.id} - {destination.slug}
                        {destination.destination_identifier
                          ? ` · ${destination.destination_identifier}`
                          : ""}
                      </div>
                      <div className="mt-3 flex items-center gap-2 xl:hidden">
                        <Link
                          to={`/wp/destinations/${destination.id}/edit`}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-amber-50 text-amber-600"
                          title="Edit"
                          aria-label={`Edit destination ${destination.id}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => onDelete(destination)}
                          disabled={deletingDestinationId === destination.id}
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl bg-rose-50 text-rose-600 disabled:opacity-60"
                          title="Delete"
                          aria-label={`Delete destination ${destination.id}`}
                        >
                          {deletingDestinationId === destination.id ? (
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
                    {destination.destination_region || "-"}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-slate-700 font-bold uppercase">
                    {destination.destination_country || "-"}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-slate-500 font-semibold">
                    {destination.type_of_destination || "-"}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-slate-700 font-bold">
                    {formatDate(destination.modified || destination.date)}
                  </div>
                  {isStale(destination.modified || destination.date) && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                      <AlertTriangle className="w-4 h-4" />
                      Needs review
                    </div>
                  )}
                  {destination.date && destination.modified && destination.date !== destination.modified && (
                    <div className="text-xs text-slate-400 font-semibold mt-1">
                      Created {formatDate(destination.date)}
                    </div>
                  )}
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex justify-center items-center gap-2">
                    <Link
                      to={`/post/${destination.id}`}
                      className="p-3 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-2xl transition-all duration-300"
                      title="View"
                      aria-label={`View destination ${destination.id}`}
                      data-testid={`destination-${destination.id}-view`}
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <Link
                      to={`/wp/destinations/${destination.id}/edit`}
                      className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-amber-100"
                      title="Edit"
                      aria-label={`Edit destination ${destination.id}`}
                      data-testid={`destination-${destination.id}-edit`}
                    >
                      <Edit className="w-5 h-5" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(destination)}
                      disabled={deletingDestinationId === destination.id}
                      className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300"
                      title="Delete"
                      aria-label={`Delete destination ${destination.id}`}
                      data-testid={`destination-${destination.id}-delete`}
                    >
                      {deletingDestinationId === destination.id ? (
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

      {destinations.length > pageSize && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 bg-white border-t border-slate-100">
          <p className="text-sm font-bold text-slate-400">
            Showing {firstRecord}-{lastRecord} of {destinations.length}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`h-10 min-w-10 px-3 rounded-xl text-sm font-black transition-all ${
                      currentPage === page
                        ? "bg-sky-600 text-white shadow-lg shadow-sky-100"
                        : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                    aria-label={`Page ${page}`}
                    aria-current={currentPage === page ? "page" : undefined}
                  >
                    {page}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {destinations.length === 0 && (
        <div className="text-center py-20 bg-slate-50/50">
          <div className="bg-white inline-flex p-6 rounded-full shadow-lg shadow-slate-100 mb-6">
            <Globe className="w-12 h-12 text-slate-200" />
          </div>
          <p className="text-slate-400 text-xl font-bold">
            {t.noDestinations}
          </p>
        </div>
      )}
    </div>
  );
}
