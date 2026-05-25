import { useEffect, useRef, useState } from "react";
import { Braces, CheckCircle2, Loader2, Upload, X, XCircle } from "lucide-react";
import { importAccommodationItems } from "../services/accommodationImportApi";
import { fetchWpAuthStatus } from "../services/wpAuthApi";
import { AccommodationImportItem } from "../types/accommodationImport";
import { ImportProgressEvent } from "../types/importProgress";
import { parseAccommodationJson } from "../utils/parseAccommodationJson";
import { translations } from "./translations";

type ValidationStatus = "idle" | "valid" | "invalid";

type AccommodationJsonImportModalProps = {
  onClose: () => void;
  onParsed: (items: AccommodationImportItem[]) => void;
  onInsertSuccess: () => void;
};

export default function AccommodationJsonImportModal({
  onClose,
  onParsed,
  onInsertSuccess,
}: AccommodationJsonImportModalProps) {
  const t = translations.en;
  const [jsonText, setJsonText] = useState("");
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus>("idle");
  const [parseError, setParseError] = useState<string | null>(null);
  const [insertError, setInsertError] = useState<string | null>(null);
  const [insertSuccess, setInsertSuccess] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<AccommodationImportItem[]>([]);
  const [isInserting, setIsInserting] = useState(false);
  const [insertProgressLog, setInsertProgressLog] = useState<ImportProgressEvent[]>(
    [],
  );
  const progressLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (progressLogRef.current) {
      progressLogRef.current.scrollTop = progressLogRef.current.scrollHeight;
    }
  }, [insertProgressLog, isInserting]);

  const progressLevelClassName = (level: ImportProgressEvent["level"]) => {
    switch (level) {
      case "create":
        return "text-indigo-700";
      case "update":
        return "text-amber-700";
      case "skip":
        return "text-slate-500";
      case "success":
        return "text-emerald-700";
      default:
        return "text-sky-700";
    }
  };

  const handleParse = () => {
    setParseError(null);
    setInsertError(null);
    setInsertSuccess(null);
    setParsedItems([]);
    setValidationStatus("idle");

    try {
      const items = parseAccommodationJson(jsonText);
      setValidationStatus("valid");
      setParsedItems(items);
      onParsed(items);
    } catch (error) {
      setValidationStatus("invalid");
      setParseError(
        error instanceof Error ? error.message : "Failed to parse JSON.",
      );
    }
  };

  const handleInsert = async () => {
    if (parsedItems.length === 0) return;

    setIsInserting(true);
    setInsertError(null);
    setInsertSuccess(null);
    setInsertProgressLog([]);

    const reportProgress = (event: ImportProgressEvent) => {
      setInsertProgressLog((current) => [...current, event]);
    };

    try {
      const authStatus = await fetchWpAuthStatus();
      if (!authStatus.canWrite) {
        setInsertError(
          authStatus.message || t.accommodationJsonInsertNoCredentials,
        );
        return;
      }

      reportProgress({
        level: "info",
        message: "Checking WordPress credentials...",
      });
      reportProgress({
        level: "success",
        message: "WordPress credentials OK.",
      });

      const summary = await importAccommodationItems(parsedItems, reportProgress);
      const messages: string[] = [];

      if (summary.created > 0) {
        messages.push(
          t.accommodationJsonInsertCreated.replace(
            "{count}",
            String(summary.created),
          ),
        );
      }

      if (summary.skipped > 0) {
        messages.push(
          t.accommodationJsonInsertSkipped.replace(
            "{count}",
            String(summary.skipped),
          ),
        );
      }

      if (summary.travelOffersCreated > 0) {
        messages.push(
          t.accommodationJsonInsertTravelOffers.replace(
            "{count}",
            String(summary.travelOffersCreated),
          ),
        );
      }

      if (summary.travelOffersSkipped > 0) {
        messages.push(
          t.accommodationJsonInsertTravelOffersSkipped.replace(
            "{count}",
            String(summary.travelOffersSkipped),
          ),
        );
      }

      if (summary.destinationsCreated > 0) {
        messages.push(
          t.accommodationJsonInsertDestinationsCreated.replace(
            "{count}",
            String(summary.destinationsCreated),
          ),
        );
      }

      if (summary.destinationsSkipped > 0) {
        messages.push(
          t.accommodationJsonInsertDestinationsSkipped.replace(
            "{count}",
            String(summary.destinationsSkipped),
          ),
        );
      }

      if (summary.destinationsUpdated > 0) {
        messages.push(
          t.accommodationJsonInsertDestinationsUpdated.replace(
            "{count}",
            String(summary.destinationsUpdated),
          ),
        );
      }

      setInsertSuccess(
        messages.join(" ") ||
          t.accommodationJsonInsertSuccess.replace(
            "{count}",
            String(parsedItems.length),
          ),
      );
      onInsertSuccess();
    } catch (error) {
      setInsertError(
        error instanceof Error
          ? error.message
          : t.accommodationJsonInsertFailed,
      );
    } finally {
      setIsInserting(false);
    }
  };

  const handleClose = () => {
    setJsonText("");
    setValidationStatus("idle");
    setParseError(null);
    setInsertError(null);
    setInsertSuccess(null);
    setParsedItems([]);
    setInsertProgressLog([]);
    onClose();
  };

  const textareaClassName =
    validationStatus === "valid"
      ? "border-emerald-500 bg-emerald-50/40 focus:border-emerald-500 focus:bg-white"
      : validationStatus === "invalid"
        ? "border-rose-500 bg-rose-50/40 focus:border-rose-500 focus:bg-white"
        : "border-transparent focus:border-sky-500 focus:bg-white";

  const preview = parsedItems.slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in">
      <div className="bg-white/95 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in duration-300">
        <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Braces className="w-8 h-8 text-sky-500" />
              {t.accommodationJsonImport}
            </h2>
            <p className="text-slate-400 font-bold text-sm mt-1">
              {t.accommodationJsonImportHint}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10 space-y-6">
          <div className="space-y-4">
            <label className="block text-sm font-black text-slate-400 uppercase tracking-widest">
              {t.accommodationJsonPaste}
            </label>
            <textarea
              value={jsonText}
              onChange={(event) => {
                setJsonText(event.target.value);
                setValidationStatus("idle");
                setParseError(null);
                setInsertError(null);
                setInsertSuccess(null);
                setParsedItems([]);
              }}
              rows={14}
              disabled={isInserting}
              className={`w-full px-6 py-4 bg-slate-50 border-2 rounded-[2rem] outline-none transition-all duration-300 font-mono text-sm text-slate-700 leading-relaxed shadow-inner disabled:opacity-60 ${textareaClassName}`}
              placeholder={`{\n  "name": "Camping Vilanova Park",\n  "country": "Spanje",\n  "region": "Costa Dorada",\n  "city": "Vilanova i la Geltrú",\n  "facilities": ["Zwembad buiten", "Zwembad binnen"],\n  "rating": 9.0,\n  "review_count": 1074,\n  "price_per_person_from": 221,\n  "departure_date": "2026-05-27",\n  "duration_days": 7,\n  "departure_airport": "Charleroi (Brussel Zuid)",\n  "transfer_included": false,\n  "board_type": "Logies"\n}`}
            />
          </div>

          {validationStatus === "invalid" && parseError && (
            <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 px-5 py-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-rose-800">
                  {t.accommodationJsonInvalid}
                </p>
                <p className="text-sm font-semibold text-rose-700 mt-1">
                  {parseError}
                </p>
              </div>
            </div>
          )}

          {validationStatus === "valid" && parsedItems.length > 0 && (
            <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 px-5 py-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm font-black text-emerald-800">
                  {t.accommodationJsonValid.replace(
                    "{count}",
                    String(parsedItems.length),
                  )}
                </p>
              </div>
              {preview.length > 0 && (
                <ul className="text-sm text-emerald-900/80 font-semibold space-y-1 pl-8">
                  {preview.map((item, index) => (
                    <li key={`${item.name}-${index}`}>
                      • {item.name}
                      {item.city ? ` — ${item.city}` : ""}
                      {item.country ? `, ${item.country}` : ""}
                    </li>
                  ))}
                  {parsedItems.length > preview.length && (
                    <li className="text-emerald-700/70">
                      …and {parsedItems.length - preview.length} more
                    </li>
                  )}
                </ul>
              )}
            </div>
          )}

          {insertProgressLog.length > 0 && (
            <div className="rounded-2xl bg-slate-50 border-2 border-slate-200 px-5 py-4 space-y-3">
              <div className="flex items-center gap-2">
                {isInserting ? (
                  <Loader2 className="w-4 h-4 text-sky-600 animate-spin shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <p className="text-sm font-black text-slate-800">
                  {t.accommodationJsonInsertProgress}
                </p>
              </div>
              <div
                ref={progressLogRef}
                className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5 pl-1"
              >
                {insertProgressLog.map((entry, index) => (
                  <p
                    key={`${entry.message}-${index}`}
                    className={`text-sm font-semibold leading-relaxed ${progressLevelClassName(entry.level)}`}
                  >
                    • {entry.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {insertError && (
            <div className="rounded-2xl bg-rose-50 border-2 border-rose-200 px-5 py-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-rose-800">
                  {t.accommodationJsonInsertFailed}
                </p>
                <p className="text-sm font-semibold text-rose-700 mt-1">
                  {insertError}
                </p>
              </div>
            </div>
          )}

          {insertSuccess && (
            <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-200 px-5 py-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-sm font-black text-emerald-800">{insertSuccess}</p>
            </div>
          )}

          <div className="flex flex-wrap justify-start gap-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isInserting}
              className="px-8 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-50 transition-all disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button
              type="button"
              onClick={handleParse}
              disabled={!jsonText.trim() || isInserting}
              className={`flex items-center gap-3 px-12 py-4 rounded-2xl font-black transition-all duration-300 disabled:opacity-50 ${
                validationStatus === "valid"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-100"
                  : validationStatus === "invalid"
                    ? "bg-rose-600 text-white hover:bg-rose-700 hover:shadow-xl hover:shadow-rose-100"
                    : "bg-gradient-to-r from-sky-600 to-blue-700 text-white hover:scale-105 hover:shadow-2xl hover:shadow-sky-200 active:scale-95"
              }`}
            >
              <Braces className="w-5 h-5" />
              {t.accommodationJsonValidate}
            </button>
            {validationStatus === "valid" && parsedItems.length > 0 && (
              <button
                type="button"
                onClick={handleInsert}
                disabled={isInserting}
                className="flex items-center gap-3 px-12 py-4 bg-gradient-to-r from-indigo-600 to-violet-700 text-white rounded-2xl font-black hover:scale-105 hover:shadow-2xl hover:shadow-indigo-200 active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                {isInserting ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                {isInserting
                  ? t.accommodationJsonInserting
                  : t.accommodationJsonInsert}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
