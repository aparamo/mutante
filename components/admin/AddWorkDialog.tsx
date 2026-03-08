"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { Loader2, X, Link, Sparkles } from "lucide-react";
import { processAndAddReferenceAction } from "@/lib/actions/pdf-actions";
import { Expert, Reference } from "@/lib/types";

interface AddWorkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  expert: Expert;
  onWorkAdded: (newWork: Reference) => void;
}

export function AddWorkDialog({ isOpen, onClose, expert, onWorkAdded }: AddWorkDialogProps) {
  const [url, setUrl] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const handleSubmit = async (targetUrl: string) => {
    if (!targetUrl) {
        setError("Por favor, proporciona una URL o sube un archivo.");
        return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
        const result = await processAndAddReferenceAction(expert.id!, targetUrl);
        if (result.success && result.data) {
            onWorkAdded(result.data as Reference);
            onClose();
        } else {
            setError(result.error || "Ocurrió un error desconocido.");
        }
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg border border-gray-200">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
           <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
             <Sparkles size={18} className="text-indigo-500"/>
             Agregar y Procesar Nueva Obra
           </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100" disabled={isProcessing}>
            <X size={20}/>
          </button>
        </div>

        <div className="p-6">
            <p className="text-sm text-gray-600 mb-6">Sube un archivo PDF o proporciona un enlace directo. La IA analizará el contenido para extraer automáticamente el título, año y descripción, y lo agregará al perfil de <strong>{expert.name}</strong>.</p>
            
            {isProcessing ? (
                 <div className="flex flex-col items-center justify-center min-h-[150px] text-center">
                    <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                    <p className="text-gray-600 font-medium">Procesando documento...</p>
                    <p className="text-gray-400 text-sm mt-1">Esto puede tomar varios segundos.</p>
                 </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase">Subir Archivo</span>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>
                    
                    <div className="flex justify-center items-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6">
                        <UploadButton
                            endpoint="pdfUploader"
                            onClientUploadComplete={(res) => {
                                if (res && res.length > 0) {
                                handleSubmit(res[0].url);
                                }
                            }}
                            onUploadError={(error: Error) => {
                                setError(`Error al subir: ${error.message}`);
                            }}
                            content={{
                                button: "Seleccionar PDF",
                                allowedContent: "Hasta 16MB"
                            }}
                            appearance={{
                                button: "bg-indigo-600 text-sm h-10 px-4",
                                container: "w-full",
                                allowedContent: "text-gray-500 text-xs"
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200"></div>
                        <span className="text-xs font-bold text-gray-400 uppercase">O Pegar URL</span>
                        <div className="h-px flex-1 bg-gray-200"></div>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                            <input 
                                type="url" 
                                placeholder="https://ejemplo.com/documento.pdf"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                            />
                        </div>
                        <button 
                            onClick={() => handleSubmit(url)}
                            disabled={!url}
                            className="bg-indigo-600 text-white text-sm font-medium px-5 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                        >
                            Procesar URL
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 text-sm font-medium p-3 rounded-md border border-red-200 mt-2">
                            <strong>Error:</strong> {error}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
