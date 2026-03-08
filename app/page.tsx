import { getExperts, getCohortsAndSectors } from "@/lib/data/experts";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DirectoryFilters } from "@/components/DirectoryFilters";

// Force dynamic rendering if we want real-time updates when DB changes
export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : "";
  const cohort = typeof params.cohort === 'string' ? parseInt(params.cohort) : undefined;
  const sector = typeof params.sector === 'string' ? params.sector : undefined;

  const experts = await getExperts(q, cohort, sector);
  const { cohorts, sectors } = await getCohortsAndSectors();

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

      <DirectoryFilters cohorts={cohorts} sectors={sectors} />

      <div className="mb-4 text-sm text-muted-foreground">
        Mostrando {experts.length} perfiles
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {experts.map((expert) => (
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
    </div>
  );
}
