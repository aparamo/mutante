import { connectToDatabase } from "../../lib/db/mongodb";
import { searchModel, embeddingModel } from "../../lib/ai/gemini";
import type { Expert, Citation,} from "../../lib/types";
import { Schema, SchemaType } from "@google/generative-ai";
import { config } from "dotenv";


config();

const BATCH_SIZE = 20; // Procesamos de a 20 para avanzar sustancialmente en el banco de conocimiento
const DELAY_MS = 5000; // 5 segundos entre llamadas

// Schema de respuesta estructurada para Gemini
const EnrichedExpertResponseSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    bio: {
      type: SchemaType.STRING,
      description: "A professional, updated biography (in Spanish) summarizing the person's trajectory, experience, and contributions to sustainable development."
    },
    topics: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "List of 3-7 key areas of expertise (e.g., 'Desarrollo Rural', 'Gestión Forestal', 'Política Ambiental')."
    },
    links: {
      type: SchemaType.OBJECT,
      properties: {
        linkedin: { type: SchemaType.STRING, description: "LinkedIn profile URL if found, otherwise empty." },
        twitter: { type: SchemaType.STRING, description: "Twitter/X profile URL if found, otherwise empty." },
        website: { type: SchemaType.STRING, description: "Personal or project website URL if found, otherwise empty." },
        organization: { type: SchemaType.STRING, description: "Organization URL if found, otherwise empty." }
      }
    },
    references: {
      type: SchemaType.ARRAY,
      description: "Books, articles, important videos, or papers authored or featuring this person.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          url: { type: SchemaType.STRING, description: "URL to the content. MUST be a valid URL or empty string." },
          type: { type: SchemaType.STRING, description: "Must be exactly one of: 'video', 'article', 'book', 'social', 'website', 'other'" },
          description: { type: SchemaType.STRING, description: "Brief summary, findings, or relevance of this specific work." }
        }
      }
    },
    citations: {
      type: SchemaType.ARRAY,
      description: "Literal, profound quotes, fundamental data, or deep lessons shared by this person found during the research. Extract these to build a knowledge base.",
      items: {
        type: SchemaType.OBJECT,
        properties: {
          quote: { type: SchemaType.STRING, description: "The exact literal quote or deep fundamental lesson." },
          sourceTitle: { type: SchemaType.STRING, description: "Title of the interview, book, or article where the quote is from." },
          sourceUrl: { type: SchemaType.STRING, description: "URL to the source if available, otherwise empty." },
          date: { type: SchemaType.STRING, description: "Approximate year or date, otherwise empty." },
          context: { type: SchemaType.STRING, description: "Brief context of the quote." },
          topics: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Specific topics related to this quote." }
        }
      }
    }
  },
  required: ["bio", "topics", "links", "references", "citations"]
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

async function main() {
  console.log("Starting Phase 2: AI Enrichment with Gemini Search Grounding...");

  const { db } = await connectToDatabase();
  const expertsCollection = db.collection<Expert>("experts");
  const citationsCollection = db.collection<Citation>("citations");

  const pendingExperts = await expertsCollection.find({ isEnriched: { $ne: true } }).limit(BATCH_SIZE).toArray();

  if (pendingExperts.length === 0) {
    console.log("No pending experts to enrich! Phase 2 is complete.");
    process.exit(0);
  }

  console.log(`Found pending experts. Processing batch of ${pendingExperts.length}...`);

  for (const expert of pendingExperts) {
    console.log(`\n-----------------------------------`);
    console.log(`Investigating: ${expert.name} (Cohort ${expert.cohort}, ${expert.sector || 'Unknown Sector'})`);
    
    try {
      // 1. Prompt Gemini con Search Grounding (Extendido y Exhaustivo)
      const prompt = `Actúa como un Investigador Experto y Documentalista. Queremos construir la base de datos de un Sistema Experto de Conocimiento.
Tu tarea es investigar a profundidad y extraer la mayor cantidad posible de conocimiento, análisis y resultados sobre:

Nombre: ${expert.name}
Título/cargo HISTÓRICO (muy antiguo): ${expert.title || 'N/A'}
Sector: ${expert.sector || 'N/A'}
Contexto: Fue parte del Programa LEAD-México del Colegio de México en la Cohorte ${expert.cohort}. Es un experto/a en Desarrollo Sustentable, Medio Ambiente o áreas afines en México o Latinoamérica.

INSTRUCCIONES EXHAUSTIVAS:
1. **Actualización de Perfil**: El cargo histórico provisto es viejo. Investiga a qué se dedica actualmente, su afiliación institucional más reciente y define su "currentTitle".
2. **Biografía y Aportaciones**: Redacta una biografía detallada (aprox. 300 palabras) sobre su trayectoria, impacto de sus ideas, qué análisis o tesis defiende, y cómo ha contribuido a su campo.
3. **Obras, Publicaciones y Trabajos (references)**: Encuentra y lista sus **3 a 5 publicaciones y trabajos más importantes**. Para CADA obra, escribe en el campo "description" un resumen de por qué es importante, cuáles fueron sus hallazgos, su análisis o sus resultados principales. ¡SE CONCISO, máximo 2 o 3 oraciones por descripción!
4. **Citas y Lecciones (citations)**: Extrae de **3 a 5 citas textuales** profundas. Busca en entrevistas, columnas de opinión, resúmenes de sus papers o transcripciones de YouTube. Queremos lecciones, ideas clave, datos crudos que hayan aportado, o descubrimientos.

REGLA CRÍTICA SOBRE LOS ENLACES (URLs):
La Inteligencia Artificial tiende a inventar enlaces. ESTO ESTÁ ESTRICTAMENTE PROHIBIDO. 
- SOLO puedes poner un enlace en el campo "url" o "sourceUrl" si es 100% real, verificado y provisto directamente por tu herramienta de Búsqueda en Google.
- Si encuentras la referencia a una obra pero no tienes la liga exacta para verla o comprarla, DEJA EL CAMPO DE URL VACÍO (""). ¡NO INVENTES NINGÚN ENLACE!
- Es 100% válido y deseable poner enlaces hacia "reseñas académicas", resúmenes (abstracts) en repositorios (como SciELO, Redalyc, Dialnet, Academia.edu, ResearchGate) si el libro/paper completo no está disponible.
- Verifica que el formato del enlace empiece con https://.

REGLA DE FORMATO: Devuelve la información estructurada estrictamente en un bloque de código JSON (empezando con \`\`\`json y terminando con \`\`\`).
NO devuelvas texto fuera del bloque JSON.
Estructura JSON esperada:
{
  "currentTitle": "Cargo, título o afiliación institucional más reciente y actualizada en el mundo real",
  "bio": "...",
  "topics": ["Tema 1", "Tema 2", "Tema 3"],
  "links": {
    "linkedin": "url o vacío", "twitter": "url o vacío", "website": "url o vacío", "organization": "url o vacío"
  },
  "references": [
    { 
      "title": "Título completo de la obra", 
      "url": "URL a la obra (Google Scholar, Academia.edu, Youtube, etc) O VACÍO si no hay link seguro", 
      "type": "video|article|book|social|website|other",
      "description": "Análisis profundo, hallazgos y resultados presentados en esta obra."
    }
  ],
  "citations": [
    { 
      "quote": "Cita textual extensa, o lección profunda de sus análisis y estudios...", 
      "sourceTitle": "De dónde se extrajo", 
      "sourceUrl": "URL de origen O VACÍO si no hay link seguro", 
      "date": "Año o fecha aprox", 
      "context": "Contexto e impacto de la lección", 
      "topics": ["tema específico"] 
    }
  ]
}
`;

      const result = await searchModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1, // Baja temperatura para más determinismo
        }
      });

      console.log(JSON.stringify(result.response, null, 2));

      let responseText = "";
      try {
        if (result.response.candidates && result.response.candidates.length > 0) {
            const content = result.response.candidates[0].content;
            if (content && content.parts && content.parts.length > 0) {
                responseText = result.response.text();
            }
        }
      } catch (e) {
        console.error("Error getting text from response:", e);
      }

      if (!responseText || responseText.trim() === "") {
         console.warn(`Empty response from Gemini for ${expert.name}. Skipping...`);
         // Mark as enriched to avoid infinite loops on invalid names
         await expertsCollection.updateOne({ _id: expert._id }, { $set: { isEnriched: true, error: "Empty response" } });
         continue; 
      }

      // Extract JSON from markdown block if present
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      let jsonString = jsonMatch ? jsonMatch[1] : responseText;
      
      // Cleanup trailing characters that might break JSON parse
      jsonString = jsonString.trim();
      if (!jsonString.endsWith("}")) {
          const lastBrace = jsonString.lastIndexOf("}");
          if (lastBrace !== -1) {
              jsonString = jsonString.substring(0, lastBrace + 1);
          } else {
              jsonString += "\n}"; 
          }
      }

      let enrichedData;
      try {
        enrichedData = JSON.parse(jsonString);
      } catch (parseError: any) {
        console.error("Failed to parse JSON for", expert.name);
        console.error("Raw Output:", responseText.substring(0, 200) + "...");
        await expertsCollection.updateOne({ _id: expert._id }, { $set: { isEnriched: true, error: "JSON Parse Error: " + parseError.message } });
        continue; 
      }

      // 2. Generar Embedding para la biografía principal
      console.log(`- Generating embedding for bio...`);
      const bioEmbedding = enrichedData.bio ? await generateEmbedding(enrichedData.bio) : [];

      // 3. Preparar los datos actualizados del experto
      const updateData: Partial<Expert> = {
        isEnriched: true,
        currentTitle: enrichedData.currentTitle,
        bio: enrichedData.bio,
        topics: enrichedData.topics || [],
        links: enrichedData.links || {},
        references: enrichedData.references || [],
        embedding: bioEmbedding.length > 0 ? bioEmbedding : undefined,
      };

      // 4. Actualizar el documento en MongoDB
      await expertsCollection.updateOne(
        { _id: expert._id },
        { $set: updateData }
      );
      console.log(`- Expert profile updated in DB.`);

      // 5. Guardar Citas (Citations) encontradas en la colección separada
      const citations = enrichedData.citations || [];
      if (citations.length > 0) {
        console.log(`- Found ${citations.length} citations/lessons. Saving to DB...`);
        const citationDocs: Citation[] = [];
        
        for (const c of citations) {
          // Crear un string semántico para el embedding de la cita
          const citationText = `Experto: ${expert.name}. Tema: ${(c.topics || []).join(", ")}. Cita/Lección: "${c.quote}". Contexto: ${c.context || ""}`;
          const citationEmbedding = await generateEmbedding(citationText);

          citationDocs.push({
            expertId: expert._id?.toString() || expert.id,
            expertName: expert.name,
            quote: c.quote,
            sourceTitle: c.sourceTitle || "",
            sourceUrl: c.sourceUrl || "",
            date: c.date || "",
            context: c.context || "",
            topics: c.topics || [],
            embedding: citationEmbedding.length > 0 ? citationEmbedding : undefined,
            isValidated: false,
            isAiGenerated: true,
          } as unknown as import("@/lib/types").Citation);
        }

        await citationsCollection.insertMany(citationDocs);
      }

      console.log(`✅ Completed: ${expert.name}`);
      
    } catch (error) {
      console.error(`❌ Error processing expert ${expert.name}:`, error);
    }

    // Esperar un poco antes de la siguiente petición para respetar rate limits
    await delay(DELAY_MS);
  }

  console.log(`\nBatch complete. Run the script again to process the next batch of ${BATCH_SIZE}.`);
  process.exit(0);
}

main();
