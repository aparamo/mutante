"use client";

import { useState } from "react";
import { Expert, EnrichedExpertData } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface EnrichmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  enrichedData: EnrichedExpertData | null;
  onSave: (mergedData: Partial<Expert>) => Promise<void>;
}

export function EnrichmentDialog({ isOpen, onClose, expert, enrichedData, onSave }: EnrichmentDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFields, setSelectedFields] = useState({
    bio: true,
    currentTitle: true,
    topics: true,
    references: true,
  });

  if (!isOpen || !enrichedData) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const mergedData: Partial<Expert> = {
        isEnriched: true,
        isAiGenerated: true,
      };

      if (selectedFields.bio) mergedData.bio = enrichedData.bio;
      if (selectedFields.currentTitle) mergedData.currentTitle = enrichedData.currentTitle;
      if (selectedFields.topics) mergedData.topics = enrichedData.topics;
      
      // Merge references - adding new ones without deleting old ones
      if (selectedFields.references && enrichedData.references && enrichedData.references.length > 0) {
        const validReferenceTypes = ["video", "article", "book", "social", "website", "other", "thesis", "interview"];
        
        const newReferences = enrichedData.references.map(ref => ({
          ...ref,
          _id: crypto.randomUUID(), // Generate a unique ID for the subdocument
          keywords: ref.keywords || [],
          isFundamental: ref.isFundamental || false,
          isAiGenerated: true,
          isValidated: false,
          url: "", // Default empty as per rules
          type: (validReferenceTypes.includes(ref.type || "") ? ref.type : "other") as "other" | "video" | "article" | "book" | "social" | "website" | "thesis" | "interview",
        }));
        
        // Append to existing references if they exist
        mergedData.references = [...(expert.references || []), ...newReferences];
      }

      await onSave(mergedData);
      onClose();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
      <div className="bg-zinc-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-zinc-700">
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900 rounded-t-xl">
          <h3 className="text-xl font-bold text-zinc-100">Validar Enriquecimiento IA</h3>
          <button onClick={onClose} disabled={isSaving} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex flex-col gap-6 text-zinc-300">
          <p className="text-sm text-zinc-400">
            Selecciona qué partes de la información extraída deseas guardar en el perfil de <strong>{expert.name}</strong>.
          </p>

          <div className="flex items-start gap-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
            <input 
              type="checkbox" 
              checked={selectedFields.bio}
              onChange={(e) => setSelectedFields({ ...selectedFields, bio: e.target.checked })}
              className="mt-1"
            />
            <div>
              <h4 className="font-semibold text-zinc-200 mb-1">Biografía</h4>
              <p className="text-sm text-zinc-400 whitespace-pre-wrap">{enrichedData.bio}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
            <input 
              type="checkbox" 
              checked={selectedFields.currentTitle}
              onChange={(e) => setSelectedFields({ ...selectedFields, currentTitle: e.target.checked })}
              className="mt-1"
            />
            <div>
              <h4 className="font-semibold text-zinc-200 mb-1">Cargo / Afiliación Actual</h4>
              <p className="text-sm text-zinc-400">{enrichedData.currentTitle}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
            <input 
              type="checkbox" 
              checked={selectedFields.topics}
              onChange={(e) => setSelectedFields({ ...selectedFields, topics: e.target.checked })}
              className="mt-1"
            />
            <div>
              <h4 className="font-semibold text-zinc-200 mb-1">Temas de Expertise</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {enrichedData.topics.map((t, i) => (
                  <span key={i} className="px-2 py-1 bg-zinc-700 text-xs rounded-md">{t}</span>
                ))}
              </div>
            </div>
          </div>

          {enrichedData.references && enrichedData.references.length > 0 && (
            <div className="flex items-start gap-4 p-4 border border-zinc-700 rounded-lg bg-zinc-800/50">
              <input 
                type="checkbox" 
                checked={selectedFields.references}
                onChange={(e) => setSelectedFields({ ...selectedFields, references: e.target.checked })}
                className="mt-1"
              />
              <div>
                <h4 className="font-semibold text-zinc-200 mb-1">Obras Encontradas ({enrichedData.references.length})</h4>
                <ul className="text-sm text-zinc-400 list-disc list-inside mt-2 space-y-1">
                  {enrichedData.references.map((ref, i) => (
                    <li key={i}>{ref.title} <span className="text-xs text-zinc-500">({ref.type || "other"})</span></li>
                  ))}
                </ul>
                <p className="text-xs text-zinc-500 mt-2 italic">Al seleccionar esta opción, estas obras se agregarán a las existentes (sin borrar las actuales).</p>
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900 rounded-b-xl">
          <button onClick={onClose} disabled={isSaving} className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-zinc-100 disabled:opacity-50">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
}
