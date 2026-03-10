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
    <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-start pt-16 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl border border-zinc-800">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center sticky top-0 bg-zinc-900/80 backdrop-blur-md rounded-t-xl z-10">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                <Search className="text-indigo-400" size={18} />
             </div>
             <div>
                <h3 className="text-lg font-bold text-zinc-100">Descubrir Obras (IA)</h3>
                <p className="text-sm text-zinc-400">Buscando publicaciones de: <span className="font-medium text-zinc-300">{expertName}</span></p>
             </div>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 p-1.5 rounded-full hover:bg-zinc-800 transition-colors">
            <X size={20}/>
          </button>
        </div>

        <div className="p-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[250px] text-center">
              <Loader2 className="animate-spin text-indigo-400 mb-4" size={32} />
              <p className="text-zinc-300 font-medium">Buscando publicaciones en la web...</p>
              <p className="text-zinc-500 text-sm mt-1">Esto puede tardar hasta 30 segundos.</p>
            </div>
          )}

          {!isLoading && results && (
            <>
              {results.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 p-3 rounded-lg">
                      <CheckCircle size={20} className="shrink-0 text-emerald-500"/>
                      <p className="text-sm font-medium">Se encontraron {results.length} posibles publicaciones. Verifica los enlaces antes de agregarlos.</p>
                  </div>
                  {results.map((pub, idx) => {
                    const buttonState = getButtonState(pub);
                    return (
                        <div key={idx} className="bg-zinc-800/50 border border-zinc-700/80 rounded-lg p-4 transition-colors hover:bg-zinc-800">
                        <h4 className="font-bold text-zinc-100">{pub.title} {pub.year && <span className="text-zinc-400 font-normal">({pub.year})</span>}</h4>
                        <p className="text-sm text-zinc-400 mt-1 mb-3 line-clamp-2">{pub.description}</p>
                        <div className="flex items-center justify-between gap-3">
                            <a href={pub.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:underline break-all line-clamp-1" title={pub.url}>
                            {pub.url}
                            </a>
                            <div className="flex gap-2 shrink-0">
                                <a href={pub.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 bg-zinc-700/50 border border-zinc-600/80 hover:bg-zinc-700 px-2.5 py-1 rounded-md transition-colors shadow-sm">
                                    <ExternalLink size={14}/> Verificar
                                </a>
                                <button 
                                    onClick={() => handleAddClick(pub)}
                                    disabled={buttonState.disabled}
                                    className={`flex items-center gap-1.5 text-xs font-medium text-white px-2.5 py-1 rounded-md transition-colors shadow-sm ${buttonState.disabled ? 'bg-zinc-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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
                    <AlertTriangle className="text-amber-500 mb-4 mx-auto" size={32} />
                    <h4 className="text-lg font-bold text-zinc-200">Sin Resultados</h4>
                    <p className="text-sm text-zinc-400 mt-1 max-w-sm">
                        La IA no pudo localizar ninguna publicación en formato PDF para este autor. Intenta agregar una obra manualmente.
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
