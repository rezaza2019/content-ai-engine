import React, { useState } from "react";
import { X, Loader, AlertCircle, CheckCircle } from "lucide-react";
import type { ParsedTravelOffer } from "../utils/parseTravelOfferUrl";
import { parseAndCreateTravelOfferFromUrl } from "../services/travelOfferUrlApi";

type TravelOfferUrlModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export default function TravelOfferUrlModal({
  isOpen,
  onClose,
  onSuccess,
}: TravelOfferUrlModalProps) {
  const [url, setUrl] = useState("");
  const [parsed, setParsed] = useState<ParsedTravelOffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [pricePerPersonFrom, setPricePerPersonFrom] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [duplicatePostId, setDuplicatePostId] = useState<number | null>(null);
  const [accommodationStatus, setAccommodationStatus] = useState<string | null>(null);

  const handlePaste = async () => {
    setError(null);

    try {
      const clipboardText = await navigator.clipboard.readText();
      setUrl(clipboardText.trim());
      setParsed(null);
      setSuccess(null);
      setDuplicatePostId(null);
    } catch {
      setError("Clipboard access was blocked. Paste the URL manually or allow clipboard permissions.");
    }
  };

  const handleParse = async () => {
    setLoading(true);
    setError(null);
    setParsed(null);
    setSuccess(null);
    setDuplicatePostId(null);
    setAccommodationStatus(null);

    try {
      const result = await parseAndCreateTravelOfferFromUrl(url, false);
      setParsed(result.parsed);
      if (result.duplicate && result.existingPostId) {
        setDuplicatePostId(result.existingPostId);
      }
      setAccommodationStatus(
        result.accommodationExists && result.accommodationId
          ? `Related accommodation found. ID: ${result.accommodationId}.`
          : "Related accommodation was not found. It will be created before the travel offer.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse URL");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!parsed) return;

    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await parseAndCreateTravelOfferFromUrl(url, true, {
        pricePerPersonFrom,
        durationDays,
      });
      if (result.created) {
        const accommodationMessage = result.accommodationCreated
          ? ` Related accommodation created first. ID: ${result.accommodationId}.`
          : result.accommodationId
            ? ` Related accommodation ID: ${result.accommodationId}.`
            : "";
        setSuccess(`Travel offer created successfully! Post ID: ${result.postId}.${accommodationMessage}`);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 2000);
      } else if (result.createError) {
        setError(result.createError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create travel offer");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setUrl("");
    setParsed(null);
    setError(null);
    setSuccess(null);
    setPricePerPersonFrom("");
    setDurationDays("");
    setDuplicatePostId(null);
    setAccommodationStatus(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-8 border-b border-slate-200 sticky top-0 bg-white">
          <h2 className="text-2xl font-bold text-slate-900">
            Create Travel Offer from URL
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={24} className="text-slate-500" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* URL Input */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              Travel Offer URL
            </label>
            <div className="space-y-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://www.vakantiediscounter.nl/spanje/andalusie/marbella/globales_pueblo_andaluz?boardingtype=AI&departuredate=2026-05-28"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
              />
              <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="h-12 px-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 transition-colors"
                >
                  Paste
                </button>
                <button
                  onClick={handleParse}
                  disabled={!url.trim() || loading}
                  className="h-12 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    "Parse"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex gap-3">
              <AlertCircle size={20} className="text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-900">Error</p>
                <p className="text-sm text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3">
              <CheckCircle size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-emerald-900">Success</p>
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            </div>
          )}

          {duplicatePostId && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Duplicate URL</p>
                <p className="text-sm text-amber-700">
                  A travel offer already exists for this URL. Existing post ID: {duplicatePostId}.
                </p>
              </div>
            </div>
          )}

          {accommodationStatus && !duplicatePostId && (
            <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 flex gap-3">
              <CheckCircle size={20} className="text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sky-900">Accommodation Check</p>
                <p className="text-sm text-sky-700">{accommodationStatus}</p>
              </div>
            </div>
          )}

          {/* Parsed Data Preview */}
          {parsed && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-slate-900">Parsed Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Country
                    </p>
                    <p className="text-sm text-slate-900 capitalize">
                      {parsed.country}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Region
                    </p>
                    <p className="text-sm text-slate-900 capitalize">
                      {parsed.region}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      City
                    </p>
                    <p className="text-sm text-slate-900 capitalize">
                      {parsed.city}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Accommodation
                    </p>
                    <p className="text-sm text-slate-900 capitalize">
                      {parsed.accommodationName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Boarding Type
                    </p>
                    <p className="text-sm text-slate-900">
                      {parsed.boardingType}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase">
                      Departure Date
                    </p>
                    <p className="text-sm text-slate-900">
                      {parsed.departureDate}
                    </p>
                  </div>
                  {parsed.departureAirports.length > 0 && (
                    <div className="col-span-2">
                      <p className="text-xs font-bold text-slate-500 uppercase">
                        Departure Airports
                      </p>
                      <p className="text-sm text-slate-900">
                        {parsed.departureAirports.join(", ")}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <h3 className="font-bold text-slate-900">Manual Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Price per person from
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pricePerPersonFrom}
                      onChange={(e) => setPricePerPersonFrom(e.target.value)}
                      placeholder="e.g. 499"
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">
                      Duration days
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={durationDays}
                      onChange={(e) => setDurationDays(e.target.value)}
                      placeholder="e.g. 8"
                      className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Create Post Button */}
              <button
                onClick={handleCreatePost}
                disabled={creating || Boolean(duplicatePostId)}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Travel Offer Post"
                )}
              </button>
            </div>
          )}

          {/* Example Text */}
          {!parsed && (
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Example URL format:</strong> Paste a URL like{" "}
                <code className="inline-block max-w-full bg-blue-100 px-2 py-1 rounded text-xs font-mono whitespace-normal break-all align-top">
                  https://www.vakantiediscounter.nl/spanje/andalusie/marbella/globales_pueblo_andaluz?boardingtype=AI&departuredate=2026-05-28
                </code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
