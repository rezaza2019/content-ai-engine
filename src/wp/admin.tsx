import React, { useEffect, useState } from "react";
import {
  fetchDestinations,
  updateDestination,
  createDestination,
  deleteDestination,
} from "../services/destinationApi";
import {
  generateDestinationContent,
  parseDestinationInfo,
} from "../services/geminiApi";
import { fetchTicketDeals, TicketProduct } from "../services/ticketApi";
import { fetchWpTickets } from "../services/ticketWpApi";
import { fetchDeals } from "../services/dealApi";
import { fetchAccommodations } from "../services/accommodationApi";
import { fetchTravelOffers } from "../services/travelOfferApi";
import { mergeTickets } from "../utils/mergeTickets";
import { Destination } from "../types/destination";
import { Deal } from "../types/deal";
import { Accommodation } from "../types/accommodation";
import { TravelOffer } from "../types/travelOffer";
import { MergedTicket } from "../types/ticket";
import Header from "./Header";
import Footer from "./Footer";
import LoadingSpinner from "./LoadingSpinner";
import ErrorMessage from "./ErrorMessage";
import TicketEditModal from "./tickets/TicketEditModal";
import AdminHeader, { AdminTab } from "./AdminHeader";
import DestinationTable from "./DestinationTable";
import DestinationEditModal from "./DestinationEditModal";
import TicketsTable from "./TicketsTable";
import DealsTable from "./DealsTable";
import AccommodationsTable from "./AccommodationsTable";
import TravelOffersTable from "./TravelOffersTable";
import { Trash2, X, Zap } from "lucide-react";
import { translations } from "./translations";

export default function AdminPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tickets, setTickets] = useState<MergedTicket[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [travelOffers, setTravelOffers] = useState<TravelOffer[]>([]);
  const [activeTab, setActiveTab] = useState<AdminTab>("destinations");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingDest, setEditingDest] = useState<Partial<Destination> | null>(
    null,
  );
  const [editingTicket, setEditingTicket] = useState<MergedTicket | null>(null);
  const [pendingDeleteDestination, setPendingDeleteDestination] =
    useState<Destination | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [deletingDestinationId, setDeletingDestinationId] = useState<
    string | number | null
  >(null);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [selectedAIFields, setSelectedAIFields] = useState<string[]>([
    "content",
  ]);

  const t = translations.en;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (activeTab === "destinations") {
        const data = await fetchDestinations();
        setDestinations(data);
      } else if (activeTab === "tickets") {
        const [ttData, wpData] = await Promise.all([
          fetchTicketDeals(),
          fetchWpTickets(),
        ]);
        const merged = mergeTickets(ttData, wpData, "en");
        setTickets(merged);
      } else if (activeTab === "deals") {
        const data = await fetchDeals();
        setDeals(data);
      } else if (activeTab === "accommodations") {
        const data = await fetchAccommodations();
        setAccommodations(data);
      } else {
        const data = await fetchTravelOffers();
        setTravelOffers(data);
      }
    } catch (err) {
      setError(`Failed to load ${activeTab}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleAddNew = () => {
    setEditingDest({
      title: { rendered: "" },
      content: { rendered: "" },
      price: "",
      duration: "",
      departure_date: "",
      aff_link: "",
      destination_name: "",
      destination_region: "",
      destination_country: "",
    });
  };

  const getPlainDestinationTitle = (destination: Destination) =>
    destination.title?.rendered?.replace(/<[^>]*>/g, "") ||
    `#${destination.id}`;

  const handleDeleteDestination = (destination: Destination) => {
    if (!destination.id) return;
    setPendingDeleteDestination(destination);
  };

  const confirmDeleteDestination = async () => {
    if (!pendingDeleteDestination?.id) return;

    setDeletingDestinationId(pendingDeleteDestination.id);
    try {
      await deleteDestination(pendingDeleteDestination.id);
      setDestinations((prev) =>
        prev.filter((item) => item.id !== pendingDeleteDestination.id),
      );
      setPendingDeleteDestination(null);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    } finally {
      setDeletingDestinationId(null);
    }
  };

  const handleQuickImportTicket = (ticket: TicketProduct) => {
    setEditingDest({
      title: { rendered: ticket.name },
      content: {
        rendered: ticket.properties.descriptionLong?.[0] || ticket.description,
      },
      price: ticket.price.amount.toString(),
      duration: "",
      destination_name: ticket.name,
      destination_region: "",
      destination_country: "",
      aff_link: ticket.URL,
      departure_date: "",
    });
  };

  const handleSmartImport = async () => {
    if (!importText.trim()) return;

    setIsParsing(true);
    try {
      const parsed = await parseDestinationInfo(importText, "en");
      setEditingDest({
        title: { rendered: parsed.title },
        content: { rendered: parsed.content || "" },
        price: parsed.price || "",
        duration: parsed.duration || "",
        destination_region: parsed.destination_region || "",
        destination_country: parsed.destination_country || "",
        departure_date: "",
        aff_link: "",
      });
      setShowSmartImport(false);
      setImportText("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!editingDest?.title?.rendered) {
      alert("Please enter destination name first");
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateDestinationContent(
        editingDest.title.rendered,
        "en",
        selectedAIFields,
      );

      if (generated.content) updateField("content", generated.content);
      if (generated.price) updateField("price", generated.price);
      if (generated.duration) updateField("duration", generated.duration);
      if (generated.destination_region)
        updateField("destination_region", generated.destination_region);
      if (generated.destination_country)
        updateField("destination_country", generated.destination_country);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleAIField = (field: string) => {
    setSelectedAIFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDest) return;

    setIsSaving(true);
    try {
      if (editingDest.id) {
        await updateDestination(editingDest as Destination);
        setDestinations((prev) =>
          prev.map((d) =>
            d.id === editingDest.id ? (editingDest as Destination) : d,
          ),
        );
      } else {
        const newId = await createDestination(editingDest);
        const newDest = { ...editingDest, id: newId } as Destination;
        setDestinations((prev) => [newDest, ...prev]);
      }
      setEditingDest(null);
    } catch (err: any) {
      console.error("Save failed:", err);
      alert(`${t.saveFailed}: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    if (!editingDest) return;

    if (field === "title") {
      setEditingDest({
        ...editingDest,
        title: { ...editingDest.title, rendered: value },
      });
    } else if (field === "content") {
      setEditingDest({
        ...editingDest,
        content: { ...editingDest.content, rendered: value },
      });
    } else {
      setEditingDest({
        ...editingDest,
        [field]: value,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-outfit" dir="ltr">
      <Header onSearch={() => {}} />

      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <AdminHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onAddNew={handleAddNew}
            onSmartImport={() => setShowSmartImport(true)}
          />

          {loading ? (
            <div className="flex justify-center items-center h-96">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <ErrorMessage
              message={error}
              onRetry={() => window.location.reload()}
            />
          ) : activeTab === "destinations" ? (
            <DestinationTable
              destinations={destinations}
              deletingDestinationId={deletingDestinationId}
              onDelete={handleDeleteDestination}
            />
          ) : activeTab === "tickets" ? (
            <TicketsTable
              tickets={tickets}
              onEdit={setEditingTicket}
              onQuickImport={handleQuickImportTicket}
            />
          ) : activeTab === "deals" ? (
            <DealsTable deals={deals} />
          ) : activeTab === "accommodations" ? (
            <AccommodationsTable accommodations={accommodations} />
          ) : (
            <TravelOffersTable offers={travelOffers} />
          )}
        </div>
      </main>

      {/* Ticket Edit Modal */}
      {editingTicket && (
        <TicketEditModal
          ticket={editingTicket}
          onClose={() => setEditingTicket(null)}
          onSaveSuccess={loadData}
        />
      )}

      {editingDest && (
        <DestinationEditModal
          destination={editingDest}
          isSaving={isSaving}
          isGenerating={isGenerating}
          selectedAIFields={selectedAIFields}
          onClose={() => setEditingDest(null)}
          onSave={handleSave}
          onGenerateAI={handleGenerateAI}
          onToggleAIField={toggleAIField}
          onUpdateField={updateField}
        />
      )}

      {pendingDeleteDestination && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.18)] w-full max-w-lg overflow-hidden border border-white/20 animate-in zoom-in duration-300">
            <div className="px-8 py-7 bg-rose-50/60 border-b border-rose-100 flex justify-between items-start gap-6">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Delete destination?
                  </h2>
                  <p className="text-sm font-bold text-slate-500 mt-2">
                    This will move the WordPress post to trash.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingDeleteDestination(null)}
                disabled={Boolean(deletingDestinationId)}
                className="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300 disabled:opacity-50"
                aria-label="Close delete confirmation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 py-8 space-y-6">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                  Destination
                </p>
                <p className="text-lg font-extrabold text-slate-900">
                  {getPlainDestinationTitle(pendingDeleteDestination)}
                </p>
                <p className="text-sm text-slate-400 font-semibold mt-1">
                  ID: #{pendingDeleteDestination.id}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingDeleteDestination(null)}
                  disabled={Boolean(deletingDestinationId)}
                  className="px-6 py-3 border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-50 active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {t.cancel}
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteDestination}
                  disabled={Boolean(deletingDestinationId)}
                  className="flex items-center justify-center gap-2 px-8 py-3 bg-rose-600 text-white rounded-2xl font-black hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-100 active:scale-95 transition-all duration-300 disabled:opacity-70"
                >
                  {deletingDestinationId ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Smart Import Modal */}
      {showSmartImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in duration-300">
            <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Zap className="w-8 h-8 text-amber-500" />
                  {t.smartImport}
                </h2>
                <p className="text-slate-400 font-bold text-sm mt-1">
                  Turn any text into a destination in one click
                </p>
              </div>
              <button
                onClick={() => setShowSmartImport(false)}
                className="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">
                  {t.importPaste}
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={10}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-amber-500 focus:bg-white rounded-[2rem] outline-none transition-all duration-300 font-medium text-slate-700 leading-relaxed shadow-inner"
                  placeholder="Paste hotel info, brochure text, or a website snippet here..."
                />
              </div>

              <div
                className="flex justify-start gap-4"
              >
                <button
                  type="button"
                  onClick={() => setShowSmartImport(false)}
                  className="px-8 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-50 transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleSmartImport}
                  disabled={isParsing || !importText.trim()}
                  className="flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black hover:scale-105 hover:shadow-2xl hover:shadow-amber-200 active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {isParsing ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Zap className="w-5 h-5" />
                  )}
                  {isParsing ? t.parsing : t.importBtn}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
