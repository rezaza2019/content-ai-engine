import { CheckCircle, ExternalLink, Ticket, Wand2, Zap } from "lucide-react";
import { TicketProduct } from "../services/ticketApi";
import { MergedTicket } from "../types/ticket";
import { translations } from "./translations";

type TicketsTableProps = {
  tickets: MergedTicket[];
  onEdit: (ticket: MergedTicket) => void;
  onQuickImport: (ticket: TicketProduct) => void;
};

export default function TicketsTable({
  tickets,
  onEdit,
  onQuickImport,
}: TicketsTableProps) {
  const t = translations.en;

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/50 overflow-hidden border border-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Ticket
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.price}
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Status
              </th>
              <th className="px-8 py-6 text-left text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                Brand
              </th>
              <th className="px-8 py-6 text-center text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t.actions}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {tickets.map((ticket) => (
              <tr
                key={ticket.tradeTracker.ID}
                className="group hover:bg-slate-50/80 transition-all duration-300"
              >
                <td className="px-8 py-6">
                  <div className="flex items-center">
                    <div className="h-16 w-16 flex-shrink-0 rounded-2xl overflow-hidden bg-slate-100 shadow-inner group-hover:scale-105 transition-transform duration-300">
                      {ticket.tradeTracker.images[0] ? (
                        <img
                          className="h-full w-full object-cover"
                          src={ticket.tradeTracker.images[0]}
                          alt=""
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-300">
                          <Ticket className="w-8 h-8 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="ml-6">
                      <div className="text-lg font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 max-w-md">
                        {ticket.wpTitle || ticket.tradeTracker.name}
                      </div>
                      <div className="text-sm text-slate-400 font-medium">
                        #{ticket.tradeTracker.ID}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl inline-flex items-baseline gap-1 font-black text-base shadow-sm shadow-blue-100/50 w-fit">
                      EUR {ticket.price}
                      {ticket.old_price && (
                        <span className="text-xs text-gray-400 line-through font-bold ml-1">
                          EUR {ticket.old_price}
                        </span>
                      )}
                    </div>
                    {ticket.discount && (
                      <div className="text-[10px] text-rose-500 font-black mt-1 uppercase">
                        {ticket.discount}% OFF
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  {ticket.wpId ? (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-100 w-fit">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      Enriched (WP)
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 font-bold text-xs rounded-xl border border-gray-200/60 w-fit">
                      Raw Feed
                    </span>
                  )}
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-slate-700 font-bold">
                    {ticket.tradeTracker.properties.brand?.[0] || "-"}
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex justify-center items-center gap-2">
                    {ticket.tradeTracker.URL && (
                      <a
                        href={ticket.tradeTracker.URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all duration-300"
                        title="External Link"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onEdit(ticket)}
                      className="p-3 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-purple-100"
                      title={t.enrichTicket}
                    >
                      <Wand2 className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onQuickImport(ticket.tradeTracker)}
                      className="p-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-amber-100"
                      title={t.quickImport}
                    >
                      <Zap className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-20 bg-slate-50/50">
          <div className="bg-white inline-flex p-6 rounded-full shadow-lg shadow-slate-100 mb-6">
            <Ticket className="w-12 h-12 text-slate-200" />
          </div>
          <p className="text-slate-400 text-xl font-bold">{t.noTickets}</p>
        </div>
      )}
    </div>
  );
}
