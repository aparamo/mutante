"use client";

import { useState, useEffect } from "react";
import { Reference, Citation } from "@/lib/types";
import { 
  Book, FileText, Youtube, GraduationCap, Mic, Globe, 
  ExternalLink, Copy, Check, MessageSquare, Quote, User, Calendar
} from "lucide-react";
import { formatAPA7 } from "@/lib/utils/bibliography";
import { getCitationsForReferenceAction } from "@/lib/actions/knowledge-actions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

interface Props {
  work: Reference & { expertName: string; expertId: string };
  isOpen: boolean;
  onClose: () => void;
}

export function WorkDetailDialog({ work, isOpen, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [citations, setCitations] = useState<Citation[] | null>(null);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);

  const apaCitation = formatAPA7(work, work.expertName);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(apaCitation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCitation = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedCitationId(id);
    setTimeout(() => setCopiedCitationId(null), 2000);
  };

  useEffect(() => {
    const fetchCitations = async () => {
      if (!isOpen || citations) return;
      setIsLoadingCitations(true);
      try {
        const data = await getCitationsForReferenceAction(work.expertId, work.title);
        setCitations(data as Citation[]);
      } catch (error) {
        console.error("Error fetching citations:", error);
      } finally {
        setIsLoadingCitations(false);
      }
    };

    fetchCitations();
  }, [isOpen, work.expertId, work.title, citations]);

  const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'book': return <Book size={18} className="text-blue-400" />;
      case 'article': return <FileText size={18} className="text-emerald-400" />;
      case 'video': return <Youtube size={18} className="text-red-400" />;
      case 'thesis': return <GraduationCap size={18} className="text-purple-400" />;
      case 'interview': return <Mic size={18} className="text-orange-400" />;
      default: return <Globe size={18} className="text-zinc-500" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="bg-zinc-950 border-zinc-800 text-zinc-100 p-0 sm:max-w-[85vw] w-full max-w-full h-full max-h-[94vh] flex flex-col rounded-2xl shadow-2xl"
      >
        <DialogHeader className="p-6 sm:p-8 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800 shadow-inner">
                    <TypeIcon type={work.type || 'other'} />
                </div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{work.type}</span>
            </div>
            <DialogTitle className="text-2xl font-black italic tracking-tight text-white leading-tight mb-2 text-left">
                {work.title}
            </DialogTitle>
            <Link 
                href={`/expert/${work.expertId}`}
                className="flex items-center gap-2 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors pt-1 group"
            >
                <div className="bg-indigo-500/10 p-1.5 rounded-lg group-hover:bg-indigo-500/20 transition-colors">
                    <User size={16} />
                </div>
                {work.expertName}
            </Link>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8">
            <div className="space-y-8">
                {/* Description */}
                {work.description && (
                    <section>
                        <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3">Resumen</h4>
                        <p className="text-zinc-400 leading-relaxed text-base">
                            {work.description}
                        </p>
                    </section>
                )}

                {/* APA Citation */}
                <section className="p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Referencia</span>
                        <button 
                            onClick={handleCopy}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                            {copied ? <Check size={12}/> : <Copy size={12}/>}
                            {copied ? "COPIADO" : "COPIAR"}
                        </button>
                    </div>
                    <p className="text-xs text-zinc-300 italic font-serif leading-relaxed">
                        {apaCitation.replace(/\*/g, '')}
                    </p>
                </section>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {work.year && (
                        <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                            <span className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Año</span>
                            <div className="flex items-center gap-2 text-zinc-300">
                                <Calendar size={14} className="text-zinc-500" />
                                <span className="text-sm font-bold tabular-nums">{work.year}</span>
                            </div>
                        </div>
                    )}
                    {work.magazine && (
                        <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl col-span-2">
                            <span className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Revista / Journal</span>
                            <span className="text-sm text-zinc-300 font-medium truncate block">{work.magazine}</span>
                        </div>
                    )}
                    {work.publisher && (
                        <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl col-span-2">
                            <span className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Editorial</span>
                            <span className="text-sm text-zinc-300 font-medium truncate block">{work.publisher}</span>
                        </div>
                    )}
                    {work.pages && (
                         <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl">
                            <span className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Páginas</span>
                            <span className="text-sm font-medium">{work.pages}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
                    {work.url && (
                        <a 
                            href={work.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
                        >
                            LEER DOCUMENTO <ExternalLink size={16}/>
                        </a>
                    )}
                    <Link 
                        href={`/expert/${work.expertId}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 px-5 py-3 rounded-xl transition-all active:scale-95"
                    >
                        PERFIL DEL EXPERTO <User size={16}/>
                    </Link>
                </div>

                {/* Citations section */}
                <section className="pb-20">
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                        <MessageSquare size={16} className="text-indigo-500" />
                        Citas Textuales Clave
                    </h4>
                    
                    {isLoadingCitations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-zinc-500 text-xs">Analizando documento...</p>
                        </div>
                    ) : citations && citations.length > 0 ? (
                        <div className="space-y-4">
                            {citations.map((citation, i) => (
                                <div key={i} className="group relative bg-zinc-900/30 border border-zinc-800/50 p-5 rounded-2xl hover:border-indigo-500/30 transition-all">
                                    <div className="absolute -top-3 -left-3 bg-zinc-800 p-2 rounded-lg border border-zinc-700 text-indigo-400 group-hover:scale-110 transition-transform">
                                        <Quote size={16} />
                                    </div>
                                    <p className="text-zinc-300 leading-relaxed italic mb-4 font-serif text-lg">
                                        &quot;{citation.quote}&quot;
                                    </p>
                                    <div className="flex items-center justify-between pt-4 border-t border-zinc-800/50">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Pág.</span>
                                            <span className="text-xs font-bold text-indigo-400">{citation.pageNumber || "N/A"}</span>
                                        </div>
                                        <button 
                                            onClick={() => handleCopyCitation(citation.quote, citation._id || String(i))}
                                            className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 hover:text-white transition-colors"
                                        >
                                            {copiedCitationId === (citation._id || String(i)) ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                            {copiedCitationId === (citation._id || String(i)) ? "COPIADO" : "COPIAR"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                            <p className="text-zinc-600 text-xs">No hay citas textuales disponibles para esta obra.</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
