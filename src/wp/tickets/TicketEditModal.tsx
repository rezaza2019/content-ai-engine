import { X } from "lucide-react";
import { MergedTicket } from "../../types/ticket";

type TicketEditModalProps = {
  ticket: MergedTicket;
  onClose: () => void;
  onSaveSuccess: () => void;
};

export default function TicketEditModal({
  ticket,
  onClose,
  onSaveSuccess,
}: TicketEditModalProps) {
  const handleSave = () => {
    onSaveSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              Enrich Ticket
            </h2>
            <p className="text-sm text-slate-500 font-semibold mt-1">
              {ticket.wpTitle || ticket.tradeTracker.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 space-y-6">
          <label className="block">
            <span className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
              Title
            </span>
            <input
              defaultValue={ticket.wpTitle || ticket.tradeTracker.name}
              className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-sky-500"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
