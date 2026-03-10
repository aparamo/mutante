"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Expert } from "@/lib/types";
import { useSearchParams } from 'next/navigation';

export function ExpertGrid({ allExperts }: { allExperts: Expert[] }) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams]);

  const totalPages = Math.ceil(allExperts.length / itemsPerPage);
  const paginatedExperts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return allExperts.slice(startIndex, startIndex + itemsPerPage);
  }, [allExperts, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo(0, 0);
    }
  };
  
  const handleItemsPerPageChange = (value: string | null) => {
    if (value) {
      setItemsPerPage(Number(value));
      setCurrentPage(1);
    }
  };

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        Mostrando <span className="font-bold text-foreground">{paginatedExperts.length}</span> de <span className="font-bold text-foreground">{allExperts.length}</span> perfiles
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {paginatedExperts.map((expert) => (
          <Link key={expert.id} href={`/expert/${expert.id}`} className="transition-transform hover:scale-[1.02]">
            <Card className="h-full flex flex-col justify-between hover:border-primary/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{expert.name}</CardTitle>
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                  {expert.title || "Experto en Desarrollo Sustentable"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">Cohorte {expert.cohort}</Badge>
                  {expert.sector && <Badge variant="outline">{expert.sector}</Badge>}
                  {expert.isEnriched && <Badge variant="default" className="bg-amber-500 hover:bg-amber-600">Autocompletado</Badge>}
                </div>
                {expert.topics && expert.topics.length > 0 && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    <span className="font-semibold">Especialidad:</span> {expert.topics.slice(0, 3).join(", ")}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            {/* Placeholder to keep layout consistent */}
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
                      disabled={currentPage >= totalPages}
                      className="h-9"
                  >
                      Siguiente
                  </Button>
              </div>
          </div>
      </div>
    </div>
  );
}