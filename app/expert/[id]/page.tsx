import { getExpertById, getCitationsByExpertId } from "@/lib/data/experts";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink, BookOpen, Quote, Linkedin, Twitter, Globe, Building2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ExpertProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expert = await getExpertById(id);

  if (!expert) {
    notFound();
  }

  const citations = await getCitationsByExpertId(id);

  return (
    <div className="container max-w-screen-xl mx-auto py-8 px-4 w-full">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Volver al Directorio
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Columna Izquierda: Perfil y Bio */}
        <div className="md:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">{expert.name}</h1>
            <p className="text-xl text-muted-foreground mb-4">{expert.title}</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="secondary" className="text-sm">Cohorte {expert.cohort}</Badge>
              {expert.sector && <Badge variant="outline" className="text-sm">{expert.sector}</Badge>}
            </div>

            {expert.topics && expert.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {expert.topics.map(topic => (
                  <Badge key={topic} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}

            {expert.bio && (
              <div className="prose dark:prose-invert max-w-none">
                <h2 className="text-2xl font-semibold mb-4">Biografía y Aportaciones</h2>
                <div className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {expert.bio}
                </div>
              </div>
            )}
          </div>

          {/* Publicaciones y Trabajos */}
          {expert.references && expert.references.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <BookOpen className="mr-2" /> Obras Cumbre y Publicaciones
              </h2>
              <div className="grid gap-4">
                {expert.references.map((ref, idx) => (
                  <Card key={idx}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-start gap-2">
                        <span className="flex-1">{ref.title}</span>
                        {ref.url && (
                          <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                            <ExternalLink className="h-5 w-5" />
                          </a>
                        )}
                      </CardTitle>
                      <CardDescription className="capitalize">{ref.type}</CardDescription>
                    </CardHeader>
                    {ref.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{ref.description}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Citas y Lecciones */}
          {citations && citations.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold mb-4 flex items-center">
                <Quote className="mr-2" /> Lecciones y Citas Fundamentales
              </h2>
              <div className="space-y-6">
                {citations.map((cit, idx) => (
                  <div key={idx} className="relative pl-8 border-l-4 border-primary/50 py-2">
                    <Quote className="absolute left-0 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-primary/30 bg-background" />
                    <p className="text-lg italic mb-3">"{cit.quote}"</p>
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{cit.sourceTitle} {cit.date ? `(${cit.date})` : ""}</p>
                      {cit.context && <p className="mt-1">Contexto: {cit.context}</p>}
                      {cit.sourceUrl && (
                        <a href={cit.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center mt-1">
                          Ver fuente <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Columna Derecha: Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contacto y Redes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {expert.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <a href={`mailto:${expert.email}`} className="text-primary hover:underline break-all">
                    {expert.email}
                  </a>
                </div>
              )}
              
              {expert.links && (
                <div className="space-y-3 pt-4 border-t">
                  {expert.links.linkedin && (
                    <a href={expert.links.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Linkedin className="h-4 w-4" /> LinkedIn
                    </a>
                  )}
                  {expert.links.twitter && (
                    <a href={expert.links.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Twitter className="h-4 w-4" /> Twitter / X
                    </a>
                  )}
                  {expert.links.website && (
                    <a href={expert.links.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Globe className="h-4 w-4" /> Sitio Web Personal
                    </a>
                  )}
                  {expert.links.organization && (
                    <a href={expert.links.organization} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                      <Building2 className="h-4 w-4" /> Organización
                    </a>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
