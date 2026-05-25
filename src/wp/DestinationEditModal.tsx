import React from "react";
import { Save, Sparkles, X } from "lucide-react";
import { Destination } from "../types/destination";
import { translations } from "./translations";

type DestinationEditModalProps = {
  destination: Partial<Destination>;
  isSaving: boolean;
  isGenerating: boolean;
  selectedAIFields: string[];
  onClose: () => void;
  onSave: (event: React.FormEvent) => void;
  onGenerateAI: () => void;
  onToggleAIField: (field: string) => void;
  onUpdateField: (field: string, value: string) => void;
  layout?: "modal" | "page";
};

export default function DestinationEditModal({
  destination,
  isSaving,
  isGenerating,
  selectedAIFields,
  onClose,
  onSave,
  onGenerateAI,
  onToggleAIField,
  onUpdateField,
  layout = "modal",
}: DestinationEditModalProps) {
  const t = translations.en;
  const isPage = layout === "page";

  const aiFields = [
    { key: "content", label: t.content },
    { key: "destination_region", label: t.region },
    { key: "destination_country", label: t.country },
    { key: "destination_name_farsi", label: t.destinationNameFarsi },
    { key: "destination_region_fa", label: t.destinationRegionFarsi },
    { key: "destination_country_fa", label: t.destinationCountryFarsi },
    {
      key: "destination_region_description_farsi",
      label: t.destinationRegionDescriptionFarsi,
    },
  ];

  const inputClassName =
    "w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl outline-none transition-all duration-300 font-bold text-slate-900 shadow-inner";

  const content = (
    <div
      className={`bg-white/95 backdrop-blur-2xl overflow-hidden border border-white/20 ${
        isPage
          ? "rounded-[2rem] shadow-xl shadow-slate-200/50"
          : "rounded-[3rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-4xl animate-in zoom-in duration-300"
      }`}
    >
      <div className="px-10 py-8 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {destination.id ? t.edit : t.addNew}
          </h2>
          {destination.id && (
            <p className="text-slate-400 font-bold text-sm mt-1">
              ID: #{destination.id}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl shadow-sm border border-slate-100 transition-all duration-300"
          aria-label={isPage ? "Back to destinations" : "Close editor"}
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className={isPage ? "" : "max-h-[75vh] overflow-y-auto custom-scrollbar"}>
        <form onSubmit={onSave} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                {t.destinationName}
              </label>
              <input
                type="text"
                value={destination.title?.rendered || ""}
                onChange={(event) =>
                  onUpdateField("title", event.target.value)
                }
                className={`${inputClassName} text-lg`}
                required
                placeholder="Destination name..."
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.destinationIdentifier}
              </label>
              <input
                type="text"
                value={destination.destination_identifier || ""}
                onChange={(event) =>
                  onUpdateField("destination_identifier", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.typeOfDestination}
              </label>
              <input
                type="text"
                value={destination.type_of_destination || ""}
                onChange={(event) =>
                  onUpdateField("type_of_destination", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.region}
              </label>
              <input
                type="text"
                value={destination.destination_region || ""}
                onChange={(event) =>
                  onUpdateField("destination_region", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.country}
              </label>
              <input
                type="text"
                value={destination.destination_country || ""}
                onChange={(event) =>
                  onUpdateField("destination_country", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.destinationNameFarsi}
              </label>
              <input
                type="text"
                value={destination.destination_name_farsi || ""}
                onChange={(event) =>
                  onUpdateField("destination_name_farsi", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.destinationRegionFarsi}
              </label>
              <input
                type="text"
                value={destination.destination_region_fa || ""}
                onChange={(event) =>
                  onUpdateField("destination_region_fa", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.destinationCountryFarsi}
              </label>
              <input
                type="text"
                value={destination.destination_country_fa || ""}
                onChange={(event) =>
                  onUpdateField("destination_country_fa", event.target.value)
                }
                className={inputClassName}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-1">
                {t.destinationRegionDescriptionFarsi}
              </label>
              <textarea
                value={destination.destination_region_description_farsi || ""}
                onChange={(event) =>
                  onUpdateField(
                    "destination_region_description_farsi",
                    event.target.value,
                  )
                }
                rows={4}
                className={`${inputClassName} font-medium leading-relaxed`}
              />
            </div>

            <div className="md:col-span-2 mt-4">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-[2rem] p-8 border border-amber-100 shadow-inner overflow-hidden relative group">
                <Sparkles className="absolute -right-4 -bottom-4 w-32 h-32 text-amber-200/20 rotate-12 group-hover:rotate-0 transition-transform duration-700" />

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
                  <div>
                    <h3 className="text-xl font-black text-amber-900 flex items-center gap-2 mb-1">
                      <Sparkles className="w-6 h-6 text-amber-500" />
                      AI Assistant
                    </h3>
                    <p className="text-amber-700/70 text-sm font-bold">
                      Select fields to auto-generate
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onGenerateAI}
                    disabled={isGenerating}
                    className="flex items-center gap-3 bg-amber-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-200 active:scale-95 transition-all duration-300 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    {isGenerating ? t.generating : t.generateAI}
                  </button>
                </div>

                <div className="flex flex-wrap gap-3 relative z-10">
                  {aiFields.map((field) => (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => onToggleAIField(field.key)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-300 border-2 ${
                        selectedAIFields.includes(field.key)
                          ? "bg-amber-600 border-amber-600 text-white shadow-md shadow-amber-200"
                          : "bg-white border-amber-100 text-amber-700 hover:border-amber-300"
                      }`}
                    >
                      {field.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
                  {t.content}
                </label>
                <textarea
                  value={destination.content?.rendered || ""}
                  onChange={(event) =>
                    onUpdateField("content", event.target.value)
                  }
                  rows={12}
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-[2rem] outline-none transition-all duration-300 font-medium text-slate-700 leading-relaxed shadow-inner custom-scrollbar"
                  placeholder="Content will be generated here..."
                />
              </div>
            </div>
          </div>

          <div className="pt-10 flex justify-start gap-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 border-2 border-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-50 active:scale-95 transition-all duration-300"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-12 py-4 bg-gradient-to-r from-sky-600 to-blue-700 text-white rounded-2xl font-black hover:scale-105 hover:shadow-2xl hover:shadow-sky-200 active:scale-95 transition-all duration-300 disabled:opacity-70"
            >
              {isSaving ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {t.save}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isPage) {
    return content;
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md transition-all duration-300 animate-in fade-in"
      dir="ltr"
    >
      {content}
    </div>
  );
}
