"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebouncedCallback } from "use-debounce";

interface DirectoryFiltersProps {
  cohorts: number[];
  sectors: string[];
}

export function DirectoryFilters({ cohorts, sectors }: DirectoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Local state for immediate input feedback
  const [search, setSearch] = useState(searchParams.get("q") || "");

  // Debounce the URL update so we don't spam the server on every keystroke
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  const handleSelectChange = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-8 bg-card p-4 rounded-lg border shadow-sm">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por nombre, tema, cargo, institución..."
          className="pl-9 w-full"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            handleSearch(e.target.value);
          }}
        />
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Select 
          value={searchParams.get("cohort") || "all"} 
          onValueChange={(val) => handleSelectChange("cohort", val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Cohorte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las cohortes</SelectItem>
            {cohorts.map(c => (
              <SelectItem key={c} value={c.toString()}>Cohorte {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={searchParams.get("sector") || "all"} 
          onValueChange={(val) => handleSelectChange("sector", val)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los sectores</SelectItem>
            {sectors.map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
