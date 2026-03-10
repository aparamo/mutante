import { getExperts, getCohortsAndSectors } from "@/lib/data/experts";
import { DirectoryFilters } from "@/components/DirectoryFilters";
import { ExpertGrid } from "@/components/ExpertGrid";

// ... (export const dynamic)

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : "";
  const cohort = typeof params.cohort === 'string' ? parseInt(params.cohort) : undefined;
  
  let selectedSectors: string[] = [];
  if (Array.isArray(params.sector)) {
    selectedSectors = params.sector;
  } else if (typeof params.sector === 'string') {
    selectedSectors = [params.sector];
  }

  const allExperts = await getExperts(q, cohort, selectedSectors);
  const { cohorts } = await getCohortsAndSectors();
  
  const masterSectors = [
    "Academia",
    "ONG",
    "Gobierno",
    "Iniciativa Privada",
    "Organismo Internacional",
    "Sector Popular",
    "Finado"
  ];

  return (
    <div className="container max-w-screen-2xl mx-auto py-8 px-4 w-full">
      <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between md:gap-8 mb-8">
        <div className="flex-1 space-y-4">
          <h1 className="inline-block font-heading text-4xl tracking-tight lg:text-5xl">
            Directorio de Especialistas en Desarrollo Sustentable
          </h1>
          <p className="text-xl text-muted-foreground">
            Explora los perfiles y el banco de conocimiento de especialistas en desarrollo sustentable en México.
          </p>
        </div>
      </div>

      <DirectoryFilters cohorts={cohorts} sectors={masterSectors} />

      <ExpertGrid allExperts={allExperts} />
      
    </div>
  );
}
