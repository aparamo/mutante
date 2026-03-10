"use client";

import { useState, useMemo } from "react";
import { Reference } from "@/lib/types";
import { 
  Search, LayoutGrid, List, Book, FileText, Youtube, 
  GraduationCap, Mic, Globe, User, Filter, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WorkDetailDialog } from "./WorkDetailDialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";

interface Work extends Reference {
  expertName: string;
  expertId: string;
}

const typeTranslations: Record<string, string> = {
  book: 'Libro',
  article: 'Artículo',
  video: 'Video',
  thesis: 'Tesis',
  interview: 'Entrevista',
  website: 'Sitio Web',
  social: 'Red Social',
  other: 'Otro',
};

export function WorksDirectoryClient({ initialWorks }: { initialWorks: Work[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [showOnlyWithText, setShowOnlyWithText] = useState(true);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const filteredWorks = useMemo(() => {
    return initialWorks.filter(work => {
      const matchesSearch = 
        work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        work.expertName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (work.keywords || []).some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const hasText = work.isValidated || !!work.markdownPath;
      const matchesFilter = showOnlyWithText ? hasText : true;

      return matchesSearch && matchesFilter;
    }).sort((a, b) => (b.year || 0) - (a.year || 0));
  }, [initialWorks, searchTerm, showOnlyWithText]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredWorks.length / itemsPerPage);
  const paginatedWorks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWorks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWorks, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  const handleItemsPerPageChange = (value: string | null) => {
    if (value) {
      setItemsPerPage(Number(value));
      setCurrentPage(1); // Reset to first page
    }
  };

  const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case 'book': return <Book size={16} className="text-blue-400" />;
      case 'article': return <FileText size={16} className="text-emerald-400" />;
      case 'video': return <Youtube size={16} className="text-red-400" />;
      case 'thesis': return <GraduationCap size={16} className="text-purple-400" />;
      case 'interview': return <Mic size={16} className="text-orange-400" />;
      default: return <Globe size={16} className="text-zinc-500" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {selectedWork && (
        <WorkDetailDialog 
            work={selectedWork} 
            isOpen={!!selectedWork} 
            onClose={() => setSelectedWork(null)} 
        />
      )}

      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black italic tracking-tighter text-white mb-4">BIBLIOTECA MUTANTE</h1>
        <p className="text-zinc-500 max-w-2xl mx-auto">
          Explora la producción intelectual de los expertos: libros, artículos, tesis y material multimedia sobre desarrollo sustentable.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-8 items-center justify-between sticky top-14 z-30 bg-zinc-950/80 backdrop-blur-md py-4 border-y border-zinc-900">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:max-w-2xl">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input 
                    placeholder="Buscar por título, autor o tema..." 
                    className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-full focus:ring-indigo-500 h-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex items-center space-x-2 shrink-0 bg-zinc-900/50 border border-zinc-800 px-4 py-2 rounded-full">
                <Checkbox 
                    id="show-all" 
                    checked={!showOnlyWithText} 
                    onCheckedChange={(checked) => setShowOnlyWithText(!checked as boolean)}
                    className="border-zinc-700 data-[state=checked]:bg-indigo-600"
                />
                <Label htmlFor="show-all" className="text-xs font-bold text-zinc-400 cursor-pointer">Ver todas las obras</Label>
            </div>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <Button 
            variant={viewMode === "grid" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("grid")}
            className="h-8 rounded-md"
          >
            <LayoutGrid size={16} className="mr-2" /> Cuadrícula
          </Button>
          <Button 
            variant={viewMode === "table" ? "secondary" : "ghost"} 
            size="sm" 
            onClick={() => setViewMode("table")}
            className="h-8 rounded-md"
          >
            <List size={16} className="mr-2" /> Lista
          </Button>
        </div>
      </div>

      {paginatedWorks.length > 0 ? (
        <>
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedWorks.map((work, idx) => (
                <div 
                    key={idx} 
                    onClick={() => setSelectedWork(work)}
                    className="group bg-zinc-900/40 border border-zinc-800 hover:border-indigo-500/30 hover:bg-zinc-900/60 rounded-2xl p-6 transition-all flex flex-col h-full cursor-pointer relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-2 bg-zinc-800 rounded-lg">
                      <TypeIcon type={work.type || 'other'} />
                    </div>
                    <div className="flex gap-2">
                        {(work.isValidated || !!work.markdownPath) && (
                            <div title="Texto Local" className="bg-emerald-500/10 text-emerald-500 p-1 rounded-full border border-emerald-500/20">
                                <CheckCircle2 size={12} />
                            </div>
                        )}
                        {work.year && <Badge variant="outline" className="text-zinc-500 border-zinc-800 font-bold tabular-nums">{work.year}</Badge>}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 group-hover:text-indigo-400 transition-colors relative z-10">
                    {work.title}
                  </h3>
                  
                  <div className="relative z-20 mt-1">
                    <Link 
                        href={`/expert/${work.expertId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-indigo-300 transition-colors"
                    >
                        <User size={14} className="text-zinc-600" />
                        {work.expertName}
                    </Link>
                  </div>

                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-zinc-800/50 relative z-10">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{typeTranslations[work.type || 'other']}</span>
                    <span className="text-[10px] font-bold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">VER DETALLES →</span>
                  </div>

                  {/* Decorative gradient */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-600/5 blur-3xl rounded-full group-hover:bg-indigo-600/10 transition-colors"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl overflow-hidden overflow-x-auto">
              <Table>
                <TableHeader className="bg-zinc-900">
                  <TableRow className="border-zinc-800 hover:bg-zinc-900/50">
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Título</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Autor</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Año</TableHead>
                    <TableHead className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedWorks.map((work, idx) => (
                    <TableRow 
                        key={idx} 
                        onClick={() => setSelectedWork(work)}
                        className="border-zinc-800 hover:bg-zinc-800/30 transition-colors group cursor-pointer"
                    >
                      <TableCell className="font-medium text-zinc-200 py-4 max-w-md truncate group-hover:text-indigo-400">
                        {work.title}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        <Link 
                            href={`/expert/${work.expertId}`} 
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-indigo-400 transition-colors inline-flex items-center gap-2"
                        >
                            <User size={12} />
                            {work.expertName}
                        </Link>
                      </TableCell>
                      <TableCell className="text-zinc-500 tabular-nums">
                        {work.year || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          <TypeIcon type={work.type || 'other'} />
                          {typeTranslations[work.type || 'other']}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Controls */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <p>
                    Mostrando <span className="font-bold text-zinc-300">{paginatedWorks.length}</span> de <span className="font-bold text-zinc-300">{filteredWorks.length}</span> obras
                </p>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-500">Resultados por página:</span>
                      <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                          <SelectTrigger className="w-20 bg-zinc-900 border-zinc-800 text-zinc-300 h-9">
                              <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 text-zinc-300 border-zinc-800">
                              <SelectItem value="12">12</SelectItem>
                              <SelectItem value="24">24</SelectItem>
                              <SelectItem value="48">48</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="flex items-center gap-2">
                      <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="h-9"
                      >
                          Anterior
                      </Button>
                      <span className="text-sm font-bold text-zinc-400">
                          Página {currentPage} de {totalPages}
                      </span>
                      <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="h-9"
                      >
                          Siguiente
                      </Button>
                  </div>
              </div>
          </div>
        </>
      ) : (
        <div className="py-20 text-center flex flex-col items-center gap-4">
          <Filter size={48} className="text-zinc-800 opacity-20" />
          <p className="text-zinc-500">No se encontraron obras que coincidan con los filtros seleccionados.</p>
          <Button 
            variant="link" 
            onClick={() => { setShowOnlyWithText(false); setSearchTerm(""); }}
            className="text-indigo-400"
          >
            Ver todas las obras disponibles
          </Button>
        </div>
      )}
    </div>
  );
}