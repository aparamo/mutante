"use client";

import { useState } from "react";
import { Loader2, ExternalLink, X, Search, AlertTriangle, CheckCircle, PlusCircle } from "lucide-react";

export type PublicationResult = {
  title: string;
  description: string;
  year: string;
  url: string;
};

interface PublicationSearchDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  results: PublicationResult[] | null;
  onClose: () => void;
  onAddReference: (publication: PublicationResult) => Promise<void>;
  expertName: string;
}

export function PublicationSearchDialog({ isOpen, isLoading, results, onClose, onAddReference, expertName }: PublicationSearchDialogProps) {
  const [processingState, setProcessingState] = useState<Record<string, 'idle' | 'adding' | 'processing' | 'added' | 'error'>>({});
  
  if (!isOpen) return null;

  const handleAddClick = async (publication: PublicationResult) => {
    setProcessingState(prev => ({ ...prev, [publication.url]: 'adding' }));
    try {
        await onAddReference(publication);
        setProcessingState(prev => ({ ...prev, [publication.url]: 'added' }));
    } catch(error: unknown) {
        console.error("Error adding reference:", error);
        setProcessingState(prev => ({ ...prev, [publication.url]: 'error' }));
    }
  }

  const getButtonState = (publication: PublicationResult) => {
    const state = processingState[publication.url] || 'idle';
    switch (state) {
        case 'adding':
            return { text: "Agregando...", disabled: true };
        case 'processing':
             return { text: "Procesando PDF...", disabled: true };
        case 'added':
            return { text: "✔️ Agregado", disabled: true };
        case 'error':
            return { text: "Error", disabled: false }; // Allow retry
        default:
            return { text: "Agregar a Obras", disabled: false };
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start pt-16 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
          <div className="flex items-center gap-2">
             <div className="bg-indigo-50 p-1.5 rounded-md">
                <Search className="text-indigo-600" size={18} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-gray-900">Descubrir Obras (IA)</h3>
                <p className="text-sm text-gray-500">Buscando publicaciones de: {expertName}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[250px] text-center">
              <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
              <p className="text-gray-600 font-medium">Buscando publicaciones en la web...</p>
              <p className="text-gray-400 text-sm mt-1">Esto puede tardar unos segundos.</p>
            </div>
          )}

          {!isLoading && results && (
            <>
              {results.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2 bg-green-50 text-green-800 border border-green-200/50 p-3 rounded-lg">
                      <CheckCircle size={20} className="shrink-0"/>
                      <p className="text-sm font-medium">Se encontraron {results.length} posibles publicaciones. Verifica los enlaces antes de agregarlos.</p>
                  </div>
                  {results.map((pub, idx) => {
                    const buttonState = getButtonState(pub);
                    return (
                        <div key={idx} className="bg-gray-50/80 border border-gray-200/80 rounded-lg p-4">
                        <h4 className="font-bold text-gray-800">{pub.title} {pub.year && `(${pub.year})`}</h4>
                        <p className="text-sm text-gray-600 mt-1 mb-3">{pub.description}</p>
                        <div className="flex items-center justify-between gap-3">
                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all line-clamp-1" title={pub.url}>
                            {pub.url}
                            </a>
                            <div className="flex gap-2 shrink-0">
                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 px-2.5 py-1 rounded-md transition-colors shadow-sm">
                                    <ExternalLink size={14}/> Verificar
                                </a>
                                <button 
                                    onClick={() => handleAddClick(pub)}
                                    disabled={buttonState.disabled}
                                    className={`flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-md transition-colors shadow-sm ${buttonState.disabled ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                >
                                    {buttonState.text === '✔️ Agregado' ? <CheckCircle size={14}/> : <PlusCircle size={14}/>}
                                    {buttonState.text}
                                </button>
                            </div>
                        </div>
                        </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center min-h-[250px] flex flex-col justify-center items-center">
                    <AlertTriangle className="text-amber-500 mb-3 mx-auto" size={32} />
                    <h4 className="text-lg font-bold text-gray-800">Sin Resultados</h4>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm">
                        La IA no pudo localizar ninguna publicación en formato PDF para este autor.
                    </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
