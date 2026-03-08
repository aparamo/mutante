"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useDebouncedCallback } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DirectoryFiltersProps {
  cohorts: number[];
  sectors: string[];
}

export function DirectoryFilters({ cohorts, sectors }: DirectoryFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Parse current sectors
  const currentSectors = searchParams.getAll("sector");

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  const handleCohortChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set("cohort", value);
    } else {
      params.delete("cohort");
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const toggleSector = (sector: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const existingSectors = params.getAll("sector");
    
    // Clear all sector params first
    params.delete("sector");
    
    // Add back the toggled state
    if (existingSectors.includes(sector)) {
      existingSectors.filter(s => s !== sector).forEach(s => params.append("sector", s));
    } else {
      existingSectors.forEach(s => params.append("sector", s));
      params.append("sector", sector);
    }
    
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchParams.get("cohort")) count++;
    count += currentSectors.length;
    return count;
  };

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cohort");
    params.delete("sector");
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden md:flex flex-row gap-4 mb-8 bg-card p-4 rounded-lg border shadow-sm items-center">
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
        
        <div className="flex flex-row gap-4 items-center">
          <Select 
            value={searchParams.get("cohort") || "all"} 
            onValueChange={handleCohortChange}
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

          <Popover>
            <PopoverTrigger
              className="inline-flex items-center whitespace-nowrap rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-[180px] justify-between text-left font-normal"
            >
              {currentSectors.length > 0 
                ? `${currentSectors.length} sector${currentSectors.length > 1 ? 'es' : ''}` 
                : "Todos los sectores"}
              <Filter className="ml-2 h-4 w-4 opacity-50" />
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0" align="end">
              <div className="p-4 space-y-4">
                <div className="font-medium text-sm text-muted-foreground">Sectores</div>
                <div className="flex flex-col gap-3">
                  {sectors.map(sector => (
                    <div key={sector} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`desktop-${sector}`} 
                        checked={currentSectors.includes(sector)}
                        onCheckedChange={() => toggleSector(sector)}
                      />
                      <Label 
                        htmlFor={`desktop-${sector}`}
                        className="text-sm font-normal leading-none cursor-pointer"
                      >
                        {sector}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          {getActiveFilterCount() > 0 && (
            <Button variant="ghost" onClick={clearFilters} className="px-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Limpiar filtros</span>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Filters */}
      <div className="flex md:hidden flex-col gap-4 mb-8 bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="pl-9 w-full"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
          <Drawer open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="relative px-3">
                <Filter className="h-4 w-4" />
                {getActiveFilterCount() > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                    {getActiveFilterCount()}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader className="text-left">
                <DrawerTitle>Filtros</DrawerTitle>
                <DrawerDescription>
                  Ajusta los filtros para encontrar especialistas.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 space-y-6">
                <div className="space-y-3">
                  <h3 className="font-medium">Cohorte</h3>
                  <Select 
                    value={searchParams.get("cohort") || "all"} 
                    onValueChange={handleCohortChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Todas las cohortes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las cohortes</SelectItem>
                      {cohorts.map(c => (
                        <SelectItem key={c} value={c.toString()}>Cohorte {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Sectores</h3>
                  <div className="flex flex-col gap-4 pt-2">
                    {sectors.map(sector => (
                      <div key={sector} className="flex items-center space-x-3">
                        <Checkbox 
                          id={`mobile-${sector}`} 
                          checked={currentSectors.includes(sector)}
                          onCheckedChange={() => toggleSector(sector)}
                          className="h-5 w-5"
                        />
                        <Label 
                          htmlFor={`mobile-${sector}`}
                          className="text-base font-normal leading-none cursor-pointer flex-1"
                        >
                          {sector}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DrawerFooter className="pt-2">
                <DrawerClose asChild>
                  <Button variant="default">Ver Resultados</Button>
                </DrawerClose>
                {getActiveFilterCount() > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Limpiar Filtros
                  </Button>
                )}
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        
        {/* Active filters display on mobile */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2">
            {searchParams.get("cohort") && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Cohorte {searchParams.get("cohort")}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleCohortChange("all")} />
              </Badge>
            )}
            {currentSectors.map(sector => (
              <Badge key={sector} variant="secondary" className="flex items-center gap-1">
                {sector}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleSector(sector)} />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
