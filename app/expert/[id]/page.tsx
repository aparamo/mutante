import { connectToDatabase } from "@/lib/db/mongodb";
import { Expert } from "@/lib/types";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { Search, ExternalLink, Book, FileText, CheckCircle2, Sparkles, Youtube, Globe, GraduationCap, Mic } from "lucide-react";


import { ExpertReferenceItem } from "@/components/ExpertReferenceItem";

export default async function ExpertProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  if (!ObjectId.isValid(id)) return notFound();

  const { db } = await connectToDatabase();
  const expert = await db.collection("experts").findOne({ _id: new ObjectId(id) }) as unknown as Expert | null;

  if (!expert) return notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ... (Header Profile Card and Bio Section remain same) ... */}
        
        {/* Header Profile Card */}
        <div className="bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-800/50 p-8 mb-10 overflow-hidden relative">
          {/* Decorative background glow */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
             <div className="w-28 h-28 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-4xl font-black shadow-lg rotate-3 shrink-0">
               {expert.name.charAt(0)}
             </div>
             <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-3">
                   <h1 className="text-4xl font-black tracking-tight text-white leading-tight">{expert.name}</h1>
                   <div className="flex gap-2">
                    {expert.isAiGenerated && !expert.isValidated && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                          <Sparkles size={12}/> Borrador IA
                      </span>
                    )}
                    {expert.isValidated && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-2.5 py-1 rounded-full">
                          <CheckCircle2 size={12}/> Verificado
                      </span>
                    )}
                   </div>
                </div>
                
                <p className="text-xl text-zinc-300 font-medium mb-4 leading-relaxed">
                   {expert.currentTitle || expert.title}
                </p>

                {expert.links?.organizationName && (
                  <div className="flex items-center gap-2 mb-6">
                     <span className="text-xs font-bold uppercase tracking-tighter text-zinc-500">Organización</span>
                     {expert.links.organizationUrl ? (
                        <a href={expert.links.organizationUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors font-semibold flex items-center gap-1.5 group">
                          {expert.links.organizationName} 
                          <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"/>
                        </a>
                     ) : (
                        <span className="text-zinc-300 font-semibold">{expert.links.organizationName}</span>
                     )}
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {expert.topics?.map(topic => (
                    <span key={topic} className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-sm font-semibold border border-zinc-700/50 hover:border-indigo-500/50 transition-colors cursor-default">
                      {topic}
                    </span>
                  ))}
                </div>
             </div>
          </div>

          {expert.bio && (
            <div className="mt-10 pt-8 border-t border-zinc-800 relative z-10">
              <h2 className="text-xs font-black text-zinc-500 uppercase tracking-[0.2em] mb-6">Biografía Profesional</h2>
              <div className="prose prose-invert max-w-none text-zinc-400 leading-relaxed text-lg">
                {expert.bio.split('\n').map((paragraph, i) => (
                  <p key={i} className="mb-4 last:mb-0">{paragraph}</p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* References Section */}
        {expert.references && expert.references.length > 0 && (
          <div className="space-y-8 relative">
            <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-1 bg-zinc-800"></div>
                <h2 className="text-2xl font-black text-white flex items-center gap-3 italic tracking-tight">
                  <Book className="text-indigo-500" />
                  BIBLIOGRAFÍA & OBRAS
                </h2>
                <div className="h-px flex-1 bg-zinc-800"></div>
            </div>

            <div className="grid gap-6">
              {expert.references.sort((a, b) => (b.isFundamental ? 1 : 0) - (a.isFundamental ? 1 : 0)).map((ref, idx) => (
                  <ExpertReferenceItem 
                    key={idx} 
                    reference={ref} 
                    expertName={expert.name} 
                    expertId={expert._id!.toString()} 
                  />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
