"use client";

import { Loader2, ExternalLink, X, Search, AlertTriangle, CheckCircle } from "lucide-react";

type AiSearchResult = {
  found: boolean;
  url: string;
  title: string;
  source: string;
};

interface AiSearchDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  result: AiSearchResult | null;
  onClose: () => void;
  onUseUrl: (url: string) => void;
  referenceTitle: string;
}

export function AiSearchDialog({ isOpen, isLoading, result, onClose, onUseUrl, referenceTitle }: AiSearchDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-50 p-1.5 rounded-md">
                <Search className="text-indigo-600" size={18} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Asistente de Búsqueda IA</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
            <X size={20}/>
          </button>
        </div>

        <div className="p-8 flex flex-col items-center justify-center min-h-[250px]">
          {isLoading && (
            <>
              <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
              <p className="text-gray-600 font-medium text-center">Analizando la web en busca del documento...</p>
              <p className="text-gray-400 text-sm text-center mt-1">Buscando &quot;{referenceTitle}&quot;</p>
            </>
          )}

          {!isLoading && result && (
            <>
              {result.found && result.url ? (
                <div className="text-center w-full">
                   <CheckCircle className="text-emerald-500 mb-3 mx-auto" size={32} />
                   <h4 className="text-lg font-bold text-gray-800">¡Documento Encontrado!</h4>
                   <p className="text-sm text-gray-500 mt-1 mb-6">
                     La IA encontró una posible fuente para este documento. Se recomienda verificar antes de usar.
                   </p>
                   <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
                      <p className="font-bold text-gray-900 truncate" title={result.title}>{result.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Fuente: <span className="font-medium text-indigo-600">{result.source}</span></p>
                      <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline break-all mt-2 line-clamp-1">
                        {result.url}
                      </a>
                   </div>
                </div>
              ) : (
                <div className="text-center">
                    <AlertTriangle className="text-amber-500 mb-3 mx-auto" size={32} />
                    <h4 className="text-lg font-bold text-gray-800">No se encontró un PDF</h4>
                    <p className="text-sm text-gray-500 mt-1">
                        La IA no pudo localizar un enlace directo a un archivo PDF para esta obra.
                    </p>
                </div>
              )}
            </>
          )}
        </div>

        {result?.found && result.url && !isLoading && (
            <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end items-center gap-3">
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors shadow-sm">
                    <ExternalLink size={16}/> Verificar Link
                </a>
                <button 
                    onClick={() => onUseUrl(result.url)}
                    className="flex items-center gap-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                >
                    Usar esta URL y Procesar
                </button>
            </div>
        )}
      </div>
    </div>
  );
}
