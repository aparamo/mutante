import { connectToDatabase } from "@/lib/db/mongodb";
import { Expert } from "@/lib/types";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { Search, ExternalLink, Book, FileText, CheckCircle2, Sparkles, Youtube, Globe, GraduationCap, Mic } from "lucide-react";


export default async function ExpertProfilePage({ params }: { params: { id: string } }) {
  const { id } = await params;
  
  if (!ObjectId.isValid(id)) return notFound();

  const { db } = await connectToDatabase();
  const expert = await db.collection("experts").findOne({ _id: new ObjectId(id) }) as unknown as Expert | null;

  if (!expert) return notFound();

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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
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
              {expert.references.sort((a, b) => (b.isFundamental ? 1 : 0) - (a.isFundamental ? 1 : 0)).map((ref, idx) => {
                const ecosiaUrl = `https://www.ecosia.org/search?q=${encodeURIComponent(expert.name + " " + ref.title)}`;

                return (
                  <div key={idx} className={`group bg-zinc-900/50 rounded-2xl p-6 border transition-all duration-300 ${ref.isFundamental ? 'border-indigo-500/40 bg-zinc-900 shadow-[0_0_20px_rgba(79,70,229,0.05)]' : 'border-zinc-800 hover:border-zinc-700'}`}>
                    <div className="flex justify-between items-start gap-4 mb-4">
                       <h3 className="text-xl font-bold text-white group-hover:text-indigo-300 transition-colors flex items-start gap-3">
                         <span className="mt-1 bg-zinc-800 p-1.5 rounded-lg shrink-0"><TypeIcon type={ref.type} /></span>
                         {ref.title}
                       </h3>
                       {ref.isFundamental && (
                         <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-500/20 flex items-center gap-1.5 shrink-0 shadow-sm">
                           <Sparkles size={12}/> Esencial
                         </div>
                       )}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4 text-[11px] font-black uppercase tracking-wider text-zinc-500">
                       {ref.year && <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 border border-zinc-700/50">{ref.year}</span>}
                       {ref.isbn && <span className="text-indigo-400/80">ISBN: {ref.isbn}</span>}
                       <span className="bg-zinc-800/50 px-2 py-0.5 rounded border border-zinc-700/30">TYPE: {ref.type}</span>
                    </div>

                    <p className="text-zinc-400 leading-relaxed mb-6 line-clamp-3 group-hover:line-clamp-none transition-all">
                        {ref.description}
                    </p>

                    {ref.keywords && ref.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {ref.keywords.map(kw => (
                          <span key={kw} className="text-[10px] font-bold text-zinc-500 bg-zinc-950 px-2 py-1 rounded border border-zinc-800/50 hover:text-indigo-400 hover:border-indigo-500/30 transition-colors">
                            #{kw.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-zinc-800/50">
                       <div className="flex items-center gap-3">
                        {ref.isValidated && ref.url ? (
                            <a 
                                href={ref.url} 
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
                       </div>

                       {ref.isValidated && ref.markdownPath && (
                          <div className="flex items-center gap-2 bg-emerald-500/5 px-3 py-1.5 rounded-lg border border-emerald-500/10">
                             <CheckCircle2 size={16} className="text-emerald-500"/>
                             <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-tighter">Biblioteca Mutante</span>
                          </div>
                       )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
