"use client";

import { useState } from "react";
import { Reference, Citation } from "@/lib/types";
import { 
  Book, FileText, Youtube, GraduationCap, Mic, Globe, 
  Search, ExternalLink, ChevronDown, Copy, Check, MessageSquare, Quote, CheckCircle2
} from "lucide-react";
import { formatAPA7 } from "@/lib/utils/bibliography";
import { getCitationsForReferenceAction } from "@/lib/actions/knowledge-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface Props {
  reference: Reference;
  expertName: string;
  expertId: string;
}

export function ExpertReferenceItem({ reference, expertName, expertId }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [citations, setCitations] = useState<Citation[] | null>(null);
  const [isLoadingCitations, setIsLoadingCitations] = useState(false);
  const [copiedCitationId, setCopiedCitationId] = useState<string | null>(null);

  const apaCitation = formatAPA7(reference, expertName);
  const ecosiaUrl = `https://www.ecosia.org/search?q=${encodeURIComponent(expertName + " " + reference.title)}`;

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

  const fetchCitations = async () => {
    if (citations) return;
    setIsLoadingCitations(true);
    try {
      const data = await getCitationsForReferenceAction(expertId, reference.title);
      setCitations(data as Citation[]);
    } catch (error) {
      console.error("Error fetching citations:", error);
    } finally {
      setIsLoadingCitations(false);
    }
  };

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
    <div className={`group bg-zinc-900/50 rounded-2xl p-6 border transition-all duration-300 ${reference.isFundamental ? 'border-indigo-500/40 bg-zinc-900 shadow-[0_0_20px_rgba(79,70,229,0.05)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
      <div className="flex justify-between items-start gap-4 mb-4">
        <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors flex items-start gap-3">
          <span className="mt-1 bg-zinc-800 p-1.5 rounded-lg shrink-0"><TypeIcon type={reference.type || 'other'} /></span>
          {reference.title}
        </h3>
        <div className="flex items-center gap-2">
            {reference.isFundamental && (
            <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-500/20 flex items-center gap-1.5 shrink-0 shadow-sm">
                <Quote size={12}/> Esencial
            </div>
            )}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-zinc-500 hover:text-white transition-colors"
            >
                <ChevronDown className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">
        {reference.year && <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700/50">{reference.year}</span>}
        {reference.isbn && <span className="text-indigo-400/80">ISBN: {reference.isbn}</span>}
        <span className="bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/30">TYPE: {reference.type}</span>
      </div>

      <p className={`text-zinc-400 leading-relaxed mb-6 transition-all ${isExpanded ? '' : 'line-clamp-3'}`}>
          {reference.description}
      </p>

      {isExpanded && (
        <div className="mb-6 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Referencia APA7</span>
                <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                    {copied ? <Check size={12}/> : <Copy size={12}/>}
                    {copied ? "COPIADO" : "COPIAR APA"}
                </button>
            </div>
            <p className="text-sm text-zinc-300 italic font-serif">
                {apaCitation.replace(/\*/g, '')}
            </p>
            
            {/* Extended fields */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-zinc-800">
                {reference.magazine && (
                    <div>
                        <span className="block text-[10px] font-bold text-zinc-600 uppercase">Revista</span>
                        <span className="text-xs text-zinc-400">{reference.magazine}</span>
                    </div>
                )}
                {reference.publisher && (
                    <div>
                        <span className="block text-[10px] font-bold text-zinc-600 uppercase">Editorial</span>
                        <span className="text-xs text-zinc-400">{reference.publisher}</span>
                    </div>
                )}
                {reference.doi && (
                    <div>
                        <span className="block text-[10px] font-bold text-zinc-600 uppercase">DOI</span>
                        <span className="text-xs text-zinc-400">{reference.doi}</span>
                    </div>
                )}
                {reference.pages && (
                    <div>
                        <span className="block text-[10px] font-bold text-zinc-600 uppercase">Páginas</span>
                        <span className="text-xs text-zinc-400">{reference.pages}</span>
                    </div>
                )}
            </div>
        </div>
      )}

      {reference.keywords && reference.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {reference.keywords.map(kw => (
            <span key={kw} className="text-[10px] font-bold text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/50 hover:text-indigo-400 hover:border-indigo-500/30 transition-colors">
              #{kw.toUpperCase()}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-zinc-800/50">
        <div className="flex items-center gap-3">
          {reference.url ? (
              <a 
                  href={reference.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/10 active:scale-95"
              >
                  LEER DOCUMENTO <ExternalLink size={16}/>
              </a>
          ) : (
              <a 
                  href={ecosiaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-bold text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white px-5 py-2.5 rounded-xl transition-all shadow-sm active:scale-95"
              >
                  <Search size={16}/> BUSCAR OBRA
              </a>
          )}
          
          <Sheet>
            <SheetTrigger 
                className="inline-flex items-center justify-center whitespace-nowrap text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-xl border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white font-bold h-auto py-2.5 px-4"
                onClick={fetchCitations}
            >
                <MessageSquare size={16} className="mr-2" />
                CITAS
            </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-950 border-zinc-800 text-zinc-100 w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="mb-8">
                    <SheetTitle className="text-2xl font-black italic tracking-tight text-white flex items-center gap-3">
                        <MessageSquare className="text-indigo-500" />
                        CITAS TEXTUALES
                    </SheetTitle>
                    <p className="text-zinc-500 text-sm">{reference.title}</p>
                </SheetHeader>
                
                {isLoadingCitations ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-zinc-500 text-sm animate-pulse">Extrayendo conocimiento...</p>
                    </div>
                ) : citations && citations.length > 0 ? (
                    <div className="space-y-6 pb-20">
                        {citations.map((citation, i) => (
                            <div key={i} className="group relative bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl hover:border-indigo-500/30 transition-all">
                                <div className="absolute -top-3 -left-3 bg-zinc-800 p-2 rounded-lg border border-zinc-700 text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Quote size={16} />
                                </div>
                                <p className="text-zinc-300 leading-relaxed italic mb-4 font-serif text-lg">
                                    &quot;{citation.quote}&quot;
                                </p>
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Página</span>
                                        <span className="text-sm font-bold text-indigo-400">{citation.pageNumber || "N/A"}</span>
                                    </div>
                                    <button 
                                        onClick={() => handleCopyCitation(citation.quote, citation.id!)}
                                        className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
                                    >
                                        {copiedCitationId === citation.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                                        {copiedCitationId === citation.id ? "COPIADO" : "COPIAR CITA"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Quote size={48} className="mx-auto text-zinc-800 mb-4 opacity-20" />
                        <p className="text-zinc-500">No se encontraron citas textuales para esta obra.</p>
                    </div>
                )}
            </SheetContent>
          </Sheet>
        </div>

        {reference.isValidated && reference.markdownPath && (
          <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10">
              <CheckCircle2 size={16} className="text-emerald-500"/>
              <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-tighter">Biblioteca Mutante</span>
          </div>
        )}
      </div>
    </div>
  );
}
