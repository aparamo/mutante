"use client";

import { useState, useMemo } from "react";
import { Expert, Reference, Citation, EnrichedExpertData } from "@/lib/types";
import { UploadButton } from "@/lib/uploadthing";
import { 
  extractCitationsAction, 
  getCitationsForReferenceAction,
  updateCitationAction,
  deleteCitationAction
} from "@/lib/actions/knowledge-actions";
import { 
  updateExpertAction, 
  deleteExpertAction, 
  addReferenceAction,
  deleteReferenceAction,
  updateReferenceAction,
  enrichExpertManualAction,
  createReferenceAction
} from "@/lib/actions/expert-actions";
import { downloadAndParsePdfAction, autoFindPdfUrlAction } from "@/lib/actions/pdf-actions";
import { 
  CheckCircle2, Download, Search, FileText, Sparkles, Loader2, 
  Folder, FolderOpen, User, Edit2, Trash2, PlusCircle,
  BookOpen, ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { EditDialog } from "./EditDialog";
import { AiSearchDialog } from "./AiSearchDialog";
import { PublicationResult } from "./PublicationSearchDialog";

export function ExpertListClient({ initialExperts }: { initialExperts: Expert[] }) {
  const [experts, setExperts] = useState<Expert[]>(initialExperts);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [expandedCohorts, setExpandedCohorts] = useState<Set<number>>(new Set());

  // Group by Cohort
  const cohorts = useMemo(() => {
    const groups: Record<number, Expert[]> = {};
    const filtered = experts.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (e.currentTitle || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.forEach(e => {
      if (!groups[e.cohort]) groups[e.cohort] = [];
      groups[e.cohort].push(e);
    });
    return groups;
  }, [experts, searchTerm]);

  const toggleCohort = (cohort: number) => {
    const newSet = new Set(expandedCohorts);
    if (newSet.has(cohort)) newSet.delete(cohort);
    else newSet.add(cohort);
    setExpandedCohorts(newSet);
  };

  const handleUpdateLocalExpert = (updated: Expert) => {
    setExperts(experts.map(e => e.id === updated.id ? updated : e));
    setSelectedExpert(updated);
  };

  return (
    <div className="flex h-full">
      {/* SIDEBAR */}
      <div className="w-1/3 min-w-[300px] border-r border-zinc-700 bg-zinc-900/50 flex flex-col">
        <div className="p-4 border-b border-zinc-700 bg-zinc-900">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-zinc-500" />
            </div>
            <input
              type="text"
              placeholder="Buscar persona o cargo..."
              className="block w-full pl-9 pr-3 py-2 border border-zinc-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-zinc-800 text-zinc-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {Object.keys(cohorts).sort((a,b) => Number(a) - Number(b)).map((cohortStr) => {
            const cohort = Number(cohortStr);
            const isExpanded = expandedCohorts.has(cohort) || searchTerm.length > 0;
            return (
              <div key={cohort} className="mb-1">
                <button 
                  onClick={() => toggleCohort(cohort)}
                  className="flex items-center w-full px-2 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 rounded-md"
                >
                  {isExpanded ? <FolderOpen size={16} className="mr-2 text-blue-500" /> : <Folder size={16} className="mr-2 text-zinc-500" />}
                  Cohorte {cohort} 
                  <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-1.5 rounded">{cohorts[cohort].length}</span>
                </button>
                
                {isExpanded && (
                  <div className="ml-4 mt-1 flex flex-col gap-0.5 border-l border-zinc-700 pl-2">
                    {cohorts[cohort].map(expert => (
                      <button
                        key={expert.id}
                        onClick={() => setSelectedExpert(expert)}
                        className={`flex items-center text-left px-2 py-1.5 text-sm rounded-md transition-colors ${
                          selectedExpert?.id === expert.id 
                            ? "bg-indigo-600/20 text-indigo-300 font-medium" 
                            : "text-zinc-400 hover:bg-zinc-800"
                        }`}
                      >
                        <User size={14} className="mr-2 shrink-0 opacity-70" />
                        <span className="truncate">{expert.name}</span>
                        {expert.isAiGenerated && !expert.isValidated && (
                          <span title="Borrador IA" className="ml-auto w-2 h-2 rounded-full bg-yellow-400 shrink-0"></span>
                        )}
                        {expert.isValidated && (
                          <span title="Validado" className="ml-auto w-2 h-2 rounded-full bg-green-500 shrink-0"></span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto bg-zinc-900">
        {selectedExpert ? (
          <ExpertDetail 
             expert={selectedExpert} 
             onUpdate={handleUpdateLocalExpert}
             onDelete={(id) => {
               setExperts(experts.filter(e => e.id !== id));
               setSelectedExpert(null);
             }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <FolderOpen size={48} className="mb-4 opacity-20" />
            <p>Selecciona un experto en la barra lateral para ver sus detalles</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { PublicationSearchDialog } from "./PublicationSearchDialog";
import { EnrichmentDialog } from "./EnrichmentDialog";
import { EditExpertDialog } from "./EditExpertDialog";

import { findExpertPublicationsAction } from "@/lib/actions/pdf-actions";

function ExpertDetail({ expert, onUpdate, onDelete }: { expert: Expert, onUpdate: (e: Expert) => void, onDelete: (id: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // State for Publication Search
  const [isSearchingPubs, setIsSearchingPubs] = useState(false);
  const [showPubDialog, setShowPubDialog] = useState(false);
  const [pubResults, setPubResults] = useState<PublicationResult[] | null>(null);

  // State for Manual Enrichment
  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichResult, setEnrichResult] = useState<EnrichedExpertData | null>(null);

  const [editingItem, setEditingItem] = useState<{ 
    type: 'reference' | 'citation', 
    id?: string, 
    data: Partial<Reference> | { quote: string, pageNumber: string }
  } | null>(null);

  const handleManualEnrich = async () => {
    setIsEnriching(true);
    setEnrichResult(null);
    try {
        const res = await enrichExpertManualAction(expert);
        if (res.success) {
            setEnrichResult(res.data);
        } else {
            alert("Error: " + res.error);
        }
    } catch(e) {
        alert((e as Error).message);
    } finally {
        setIsEnriching(false);
    }
  };

  const handleValidate = async () => {
    try {
       await updateExpertAction(expert.id!, { isValidated: true });
       onUpdate({ ...expert, isValidated: true });
       router.refresh();
    } catch(e) { alert(e); }
  };

  const handleDelete = async () => {
    if(confirm(`¿Estás seguro de eliminar a ${expert.name}? Esto borrará también sus obras y citas de la base de datos.`)) {
      try {
        await deleteExpertAction(expert.id!);
        onDelete(expert.id!);
        router.refresh();
      } catch(e) { alert(e); }
    }
  };

  const handlePublicationSearch = async () => {
    setIsSearchingPubs(true);
    setShowPubDialog(true);
    setPubResults(null);
    try {
        const result = await findExpertPublicationsAction(expert.name);
        if (result.success) {
            setPubResults(result.data);
        } else {
            alert("Error buscando publicaciones: " + result.error);
        }
    } catch (e) {
        alert((e as Error).message);
    } finally {
        setIsSearchingPubs(false);
    }
  };

  const handleAddReference = async (publication: PublicationResult) => {
    try {
        const addResult = await addReferenceAction(expert.id!, publication);
        if (!addResult.success || !addResult.data) {
            throw new Error(addResult.error || "Failed to add reference.");
        }
        
        const newRef = addResult.data as Reference;
        onUpdate({ ...expert, references: [...(expert.references || []), newRef] });

        const processResult = await downloadAndParsePdfAction(expert.id!, newRef._id!);

        if (processResult.success && processResult.data) {
             const finalExpertState = {
                ...expert,
                references: (expert.references || []).map(r => r._id === newRef._id ? (processResult.data as Reference) : r)
             };
             onUpdate(finalExpertState);
        } else {
             throw new Error(processResult.error || "Failed to process PDF for the new reference.");
        }
    } catch (e) {
        alert((e as Error).message);
        throw e;
    }
  };

  const handleSaveEnrichment = async (mergedData: Partial<Expert>) => {
    try {
      await updateExpertAction(expert.id!, mergedData);
      onUpdate({ ...expert, ...mergedData });
      router.refresh();
    } catch(e) {
      alert("Error saving enrichment: " + (e as Error).message);
    }
  };

  return (
    <>
    {editingItem && (
        <EditDialog
            isOpen={!!editingItem}
            onClose={() => setEditingItem(null)}
            title={editingItem.id ? (editingItem.type === 'reference' ? "Editar Obra" : "Editar Cita") : "Añadir Nueva Obra"}
            initialData={editingItem.data}
            onSave={async (newData) => {
                if (editingItem.type === 'reference') {
                    if (editingItem.id) { // Editing existing reference
                        await updateReferenceAction(expert.id!, editingItem.id, newData as Partial<Reference>);
                        const newRefs = expert.references!.map(r => r._id === editingItem.id ? { ...r, ...newData } as Reference : r);
                        onUpdate({ ...expert, references: newRefs });
                    } else { // Creating new reference
                        const result = await createReferenceAction(expert.id!, newData as Partial<Reference>);
                        if (result.success && result.data) {
                            const newRefs = [...(expert.references || []), result.data];
                            onUpdate({ ...expert, references: newRefs });
                        } else {
                            throw new Error(result.error || "No se pudo crear la obra.");
                        }
                    }
                } else if (editingItem.type === 'citation' && editingItem.id) {
                    // This part remains the same for editing citations
                    // await handleUpdateCitation(editingItem.id, newData as { quote: string, pageNumber: string });
                }
            }}
        />
    )}
    <EnrichmentDialog
      isOpen={!!enrichResult}
      onClose={() => setEnrichResult(null)}
      expert={expert}
      enrichedData={enrichResult}
      onSave={handleSaveEnrichment}
    />
    <PublicationSearchDialog 
        isOpen={showPubDialog}
        isLoading={isSearchingPubs}
        results={pubResults}
        onClose={() => setShowPubDialog(false)}
        onAddReference={handleAddReference}
        expertName={expert.name}
    />
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-zinc-100">{expert.name}</h2>
            {expert.isAiGenerated && !expert.isValidated && (
               <span className="flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <Sparkles size={12}/> Borrador IA
               </span>
            )}
            {expert.isValidated && (
               <span className="flex items-center gap-1 text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 size={12}/> Validado
               </span>
            )}
          </div>
          <p className="text-lg text-zinc-400">{expert.currentTitle || expert.title}</p>
          <div className="flex items-center gap-2 mt-2 text-sm text-zinc-400">
             <span>Cohorte {expert.cohort}</span> • <span>Sector: {expert.sector || "N/A"}</span>
          </div>
        </div>
        <div className="flex gap-2">
           {!expert.isValidated && expert.isEnriched && (
             <button onClick={handleValidate} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md hover:bg-emerald-500/20">
               <CheckCircle2 size={16}/> Aprobar Perfil
             </button>
           )}
           <button 
             onClick={handleManualEnrich} 
             disabled={isEnriching} 
             className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-700 rounded-md hover:bg-indigo-700 disabled:opacity-50"
           >
             {isEnriching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16}/>}
             Enriquecer
           </button>
           <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-zinc-300 bg-zinc-800 border border-zinc-700 rounded-md hover:bg-zinc-700">
             <Edit2 size={16}/> Editar
           </button>
           <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20">
             <Trash2 size={16}/>
           </button>
        </div>
      </div>

      {expert.isEnriched ? (
        <div className="flex flex-col gap-8">
           <section>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Biografía</h3>
              <p className="text-zinc-200 leading-relaxed whitespace-pre-wrap">{expert.bio}</p>
           </section>

           <section>
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Temas de Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {expert.topics?.map(t => (
                  <span key={t} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-sm">{t}</span>
                ))}
              </div>
           </section>

           <section className="bg-zinc-950 -mx-8 px-8 py-8 border-t border-zinc-800 mt-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                   <FileText className="text-zinc-500"/>
                   Obras y Extracción de Conocimiento
                </h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setEditingItem({ type: 'reference', id: undefined, data: {} })}
                        className="flex items-center gap-1.5 text-sm text-zinc-300 bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 px-3 py-1.5 rounded-md font-medium shadow-sm"
                    >
                        <PlusCircle size={16}/> Añadir Obra
                    </button>
                    <button 
                        onClick={handlePublicationSearch}
                        disabled={isSearchingPubs}
                        className="flex items-center gap-1.5 text-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-3 py-1.5 rounded-md font-medium shadow-sm"
                    >
                        <Sparkles size={16}/> {isSearchingPubs ? "Buscando..." : "Descubrir Obras (IA)"}
                    </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                {expert.references?.map((ref) => (
                  <ReferenceItem 
                    key={ref._id} 
                    reference={ref} 
                    expert={expert} 
                    onUpdate={(updatedRef) => {
                      const newRefs = (expert.references || []).map(r => r._id === updatedRef._id ? updatedRef : r);
                      onUpdate({...expert, references: newRefs});
                    }} 
                    onDelete={(refId) => {
                      const newRefs = (expert.references || []).filter(r => r._id !== refId);
                      onUpdate({...expert, references: newRefs});
                    }}
                    onEditRequest={(item) => setEditingItem(item)}
                  />
                ))}
                {(!expert.references || expert.references.length === 0) && (
                  <p className="text-sm text-zinc-400 italic">No hay obras registradas. Haz clic en &quot;Descubrir Obras&quot; para empezar.</p>
                )}
              </div>
           </section>
        </div>
      ) : (
        <div className="py-12 text-center border-2 border-dashed border-zinc-700 rounded-xl">
           <p className="text-zinc-400">Este perfil aún no ha sido procesado por la IA (Fase 2).</p>
        </div>
      )}

      <EditExpertDialog
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        expert={expert}
        onSave={async (newData) => {
          try {
            await updateExpertAction(expert.id!, newData);
            onUpdate({ ...expert, ...newData });
            router.refresh();
          } catch(e) {
            throw e; 
          }
        }}
      />
    </div>
    </>
  );
}

function ReferenceItem({ reference, expert, onUpdate, onDelete, onEditRequest }: { 
    reference: Reference, 
    expert: Expert, 
    onUpdate: (updatedRef: Reference) => void, 
    onDelete: (refId: string) => void,
    onEditRequest: (item: { type: 'reference' | 'citation', id?: string, data: any }) => void 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  
  const [citations, setCitations] = useState<Citation[] | null>(null);
  const [isFetchingCitations, setIsFetchingCitations] = useState(false);
  const [showCitations, setShowCitations] = useState(false);

  const [isFinding, setIsFinding] = useState(false);
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [aiResult, setAiResult] = useState<{ found: boolean, url: string, title: string, source: string } | null>(null);

  const isValidated = reference.isValidated || !!reference.markdownPath;
  
  const nameParts = expert.name.split(" ").filter(p => p.length > 2);
  const firstName = nameParts[nameParts.length - 1] || "";
  const firstSurname = nameParts[0] || "";
  const searchName = `${firstSurname} ${firstName}`.trim();
  const ecosiaSearchUrl = `https://www.ecosia.org/search?q=${encodeURIComponent(searchName + " " + reference.title + " filetype:pdf")}`;

  const handleFetchPdf = async (urlToFetch: string) => {
    setIsProcessing(true);
    try {
      const result = await downloadAndParsePdfAction(expert.id!, reference._id!, urlToFetch);
      if (result.success && result.data) {
        onUpdate(result.data as Reference);
        setCustomUrl("");
        setShowUrlInput(false);
      } else {
        alert("Error procesando PDF: " + result.error);
      }
    } catch(e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleAiSearch = async () => {
    setIsFinding(true);
    setShowAiDialog(true);
    setAiResult(null);
    try {
      const result = await autoFindPdfUrlAction(expert.name, reference.title);
      if (result.success) {
        setAiResult(result.data);
      } else {
        alert("Error en la búsqueda con IA: " + result.error);
      }
    } catch(e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setIsFinding(false);
    }
  }

  const handleExtractCitations = async () => {
    setIsExtracting(true);
    try {
      const result = await extractCitationsAction(expert.id!, reference._id!);
      if (result.success) {
        alert(`¡Éxito! Se extrajeron y vectorizaron ${result.count} citas textuales de la obra.`);
        await handleToggleCitations(true);
      } else {
        alert("Error extrayendo citas: " + result.error);
      }
    } catch (e) {
      alert("Error: " + (e as Error).message);
    } finally {
      setIsExtracting(false);
    }
  };
  
  const handleToggleCitations = async (forceOpen = false) => {
    const nextShowState = forceOpen || !showCitations;
    setShowCitations(nextShowState);

    if (nextShowState && citations === null) {
        setIsFetchingCitations(true);
        try {
            const fetchedCitations = await getCitationsForReferenceAction(expert.id!, reference.title);
            setCitations(fetchedCitations as Citation[]);
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setIsFetchingCitations(false);
        }
    }
  }

  const handleDeleteReference = async () => {
    if (confirm(`¿Estás seguro de que quieres eliminar la obra "${reference.title}" y TODAS sus citas asociadas?`)) {
        try {
            await deleteReferenceAction(expert.id!, reference._id!, reference.title);
            onDelete(reference._id!);
        } catch (e) {
            alert((e as Error).message);
        }
    }
  }

  const handleDeleteCitation = async (citationId: string) => {
     if (confirm("¿Estás seguro de eliminar esta cita?")) {
        try {
            await deleteCitationAction(citationId);
            setCitations(citations!.filter(c => (c.id || c._id) !== citationId));
        } catch(e) {
            alert((e as Error).message);
        }
     }
  }

  const typeTranslations: Record<string, string> = {
    book: "Libro",
    article: "Artículo",
    thesis: "Tesis",
    interview: "Entrevista",
    video: "Video",
    other: "Otro",
  };

  const typeInSpanish = typeTranslations[reference.type] || reference.type;

  return (
    <>
      <AiSearchDialog 
        isOpen={showAiDialog}
        isLoading={isFinding}
        result={aiResult}
        onClose={() => setShowAiDialog(false)}
        onUseUrl={(url) => handleFetchPdf(url)}
        referenceTitle={reference.title}
      />

      <div className="bg-zinc-800/50 rounded-xl p-5 shadow-sm border border-zinc-700 flex flex-col gap-3">
        {/* Header */}
        <div className="flex justify-between items-start gap-4">
            <div>
              <p className="font-semibold text-zinc-100 leading-tight">{reference.title}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-400 font-medium uppercase tracking-wide">
                <span>{typeInSpanish}</span>
                {reference.year && <span>• {reference.year}</span>}
                {reference.type === 'article' && reference.magazine && <span className="normal-case not-italic bg-zinc-700 text-zinc-300 px-1.5 rounded-sm"> • {reference.magazine}</span>}
              </div>
            </div>
            {isValidated ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 whitespace-nowrap">
                <CheckCircle2 size={14} /> Texto Local
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 whitespace-nowrap">
                Sin Texto
              </span>
            )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 mt-2 pt-3 border-t border-zinc-700/50">
          {isValidated ? (
              <>
                  <button onClick={() => handleToggleCitations()} className="flex items-center gap-1.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 px-3 py-1.5 rounded-md border border-zinc-600 bg-zinc-700/50">
                      <BookOpen size={16}/>
                      Citas 
                      <ChevronDown size={16} className={`transition-transform ${showCitations ? 'rotate-180' : ''}`}/>
                  </button>
                  <button onClick={handleExtractCitations} disabled={isExtracting} className="flex items-center gap-2 text-sm text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md font-medium shadow-sm disabled:opacity-50">
                      {isExtracting ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16}/>}
                      {isExtracting ? "Analizando..." : "Re-extraer Citas"}
                  </button>
                  <div className="flex-grow"/>
                  <button onClick={() => onEditRequest({ type: 'reference', id: reference._id, data: reference })} className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-md">
                      <Edit2 size={16}/>
                  </button>
                  <button onClick={handleDeleteReference} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md">
                      <Trash2 size={16}/>
                  </button>
              </>
          ) : (
            <div className="flex flex-col w-full gap-3">
              <div className="flex flex-wrap gap-2">
                  <a href={ecosiaSearchUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-zinc-300 hover:text-zinc-100 bg-zinc-900 border border-zinc-600 px-3 py-1.5 rounded-md font-medium shadow-sm">
                  <Search size={16} /> Buscar en Ecosia
                  </a>
                  {!showUrlInput && (
                  <button onClick={() => setShowUrlInput(true)} className="flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200 bg-blue-500/10 px-3 py-1.5 rounded-md font-medium border border-blue-500/20">
                      <Download size={16} /> Extraer de URL
                  </button>
                  )}
                  <button onClick={handleAiSearch} disabled={isFinding} className="flex items-center gap-1 text-sm text-indigo-300 hover:text-indigo-200 bg-indigo-500/10 px-3 py-1.5 rounded-md font-medium border border-indigo-500/20">
                  <Sparkles size={16} /> Buscar con IA
                  </button>
                  <div className="flex-grow"/>
                  <button onClick={handleDeleteReference} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md">
                      <Trash2 size={16}/>
                  </button>
              </div>

              {showUrlInput && (
                  <div className="flex gap-2 w-full mt-1 bg-zinc-900 p-2 rounded-lg border border-zinc-700">
                  <input type="url" placeholder="Pegar link directo al PDF..." value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="flex-1 bg-zinc-800 border-zinc-600 rounded-md px-3 py-1.5 text-sm"/>
                  <button onClick={() => handleFetchPdf(customUrl)} disabled={isProcessing || !customUrl} className="bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50">
                      {isProcessing ? "Procesando..." : "Procesar"}
                  </button>
                  <button onClick={() => setShowUrlInput(false)} className="text-zinc-400 text-sm px-2">Cancelar</button>
                  </div>
              )}

              <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 font-medium">O subir PDF:</span>
                  <div className="scale-90 origin-left">
                  <UploadButton
                      endpoint="pdfUploader"
                      onClientUploadComplete={(res) => { if (res && res.length > 0) handleFetchPdf(res[0].url); }}
                      onUploadError={(error: Error) => alert(`ERROR! ${error.message}`)}
                      appearance={{ button: "ut-button:bg-zinc-700 ut-button:text-zinc-300 ut-button:text-xs ut-button:h-7 ut-button:px-3", allowedContent: "hidden" }}
                      content={{ button: "Seleccionar Archivo" }}
                  />
                  </div>
              </div>
            </div>
          )}
        </div>
        {/* Citations List */}
        {showCitations && (
             <div className="pt-3 mt-3 border-t border-zinc-700/50">
                {isFetchingCitations && <div className="flex justify-center p-4"><Loader2 className="animate-spin text-zinc-500"/></div>}
                {citations && citations.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {citations.map(citation => (
                            <div key={citation.id || citation._id} className="group bg-zinc-700/30 p-3 rounded-md border border-zinc-700/80 flex justify-between items-start">
                                <p className="text-sm text-zinc-300 leading-relaxed italic">&quot;{citation.quote}&quot;</p>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => onEditRequest({ type: 'citation', id: (citation.id || citation._id)!, data: { quote: citation.quote, pageNumber: citation.pageNumber || "" } })} className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 rounded-md">
                                        <Edit2 size={14}/>
                                    </button>
                                     <button onClick={() => handleDeleteCitation((citation.id || citation._id)!)} className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-md">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                 {citations && citations.length === 0 && <p className="text-xs text-zinc-400 italic">No se han extraído citas para esta obra todavía.</p>}
            </div>
        )}
      </div>
    </>
  );
}