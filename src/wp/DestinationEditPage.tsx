import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchDestinations,
  updateDestination,
} from "../services/destinationApi";
import { generateDestinationContent } from "../services/geminiApi";
import { Destination } from "../types/destination";
import DestinationEditModal from "./DestinationEditModal";
import ErrorMessage from "./ErrorMessage";
import LoadingSpinner from "./LoadingSpinner";
import { translations } from "./translations";

export default function DestinationEditPage() {
  const { destinationId } = useParams();
  const navigate = useNavigate();
  const t = translations.en;
  const [destination, setDestination] = useState<Partial<Destination> | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedAIFields, setSelectedAIFields] = useState<string[]>([
    "content",
  ]);

  useEffect(() => {
    const loadDestination = async () => {
      try {
        setLoading(true);
        setError(null);
        const destinations = await fetchDestinations();
        const selected = destinations.find(
          (item) => String(item.id) === String(destinationId),
        );

        if (!selected) {
          setError("Destination not found.");
          return;
        }

        setDestination({ ...selected });
      } catch {
        setError("Failed to load destination.");
      } finally {
        setLoading(false);
      }
    };

    loadDestination();
  }, [destinationId]);

  const updateField = (field: string, value: string) => {
    if (!destination) return;

    if (field === "title") {
      setDestination({
        ...destination,
        title: { ...destination.title, rendered: value },
        destination_name: value,
      });
    } else if (field === "content") {
      setDestination({
        ...destination,
        content: { ...destination.content, rendered: value },
      });
    } else {
      setDestination({
        ...destination,
        [field]: value,
      });
    }
  };

  const toggleAIField = (field: string) => {
    setSelectedAIFields((prev) =>
      prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field],
    );
  };

  const handleGenerateAI = async () => {
    if (!destination?.title?.rendered) {
      alert("Please enter destination name first");
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateDestinationContent(
        destination.title.rendered,
        "en",
        selectedAIFields,
      );

      if (generated.content) updateField("content", generated.content);
      if (generated.destination_region) {
        updateField("destination_region", generated.destination_region);
      }
      if (generated.destination_country) {
        updateField("destination_country", generated.destination_country);
      }
      if (generated.destination_name_farsi) {
        updateField("destination_name_farsi", generated.destination_name_farsi);
      }
      if (generated.destination_region_fa) {
        updateField("destination_region_fa", generated.destination_region_fa);
      }
      if (generated.destination_country_fa) {
        updateField("destination_country_fa", generated.destination_country_fa);
      }
      if (generated.destination_region_description_farsi) {
        updateField(
          "destination_region_description_farsi",
          generated.destination_region_description_farsi,
        );
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!destination?.id) return;

    setIsSaving(true);
    try {
      await updateDestination(destination as Destination);
      navigate("/wp");
    } catch (err: any) {
      console.error("Save failed:", err);
      alert(`${t.saveFailed}: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-outfit" dir="ltr">
      <main className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <LoadingSpinner />
            </div>
          ) : error || !destination ? (
            <ErrorMessage
              message={error || "Destination not found."}
              onRetry={() => navigate("/wp")}
            />
          ) : (
            <DestinationEditModal
              layout="page"
              destination={destination}
              isSaving={isSaving}
              isGenerating={isGenerating}
              selectedAIFields={selectedAIFields}
              onClose={() => navigate("/wp")}
              onSave={handleSave}
              onGenerateAI={handleGenerateAI}
              onToggleAIField={toggleAIField}
              onUpdateField={updateField}
            />
          )}
        </div>
      </main>
    </div>
  );
}
