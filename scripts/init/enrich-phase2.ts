import { connectToDatabase } from "../../lib/db/mongodb";
import { searchModel, embeddingModel } from "../../lib/ai/gemini";
import type { Expert, Reference } from "../../lib/types";
import { z } from "zod";
import { config } from "dotenv";
import { ObjectId } from "mongodb";

config();

const BATCH_SIZE = 60; // Procesamos de a 20 para avanzar sustancialmente en el banco de conocimiento
const DELAY_MS = 5000; // 5 segundos entre llamadas

// Schema de validación Zod para la respuesta de la IA (Phase 2)
// Basado en Expert, Reference y Citation de lib/types.ts, pero adaptado para lo que genera la IA
const AiResponseSchema = z.object({
  bio: z.string().describe("Biografía profesional actualizada en español"),
  currentTitle: z.string().describe("Cargo o afiliación institucional más reciente"),
  topics: z.array(z.string()).describe("Lista de 3-7 áreas clave de expertise"),
  links: z.object({
    linkedin: z.string().nullish().or(z.literal("")),
    twitter: z.string().nullish().or(z.literal("")),
    website: z.string().nullish().or(z.literal("")),
    organizationName: z.string().nullish().or(z.literal("")),
    organizationUrl: z.string().nullish().or(z.literal("")),
  }).optional().default({}),
  references: z.array(z.object({
    title: z.string(),
    type: z.string().optional().default("other"),
    description: z.string().nullish(),
    year: z.number().int().nullish(),
    keywords: z.array(z.string()).optional().default([]),
    isbn: z.string().nullish().or(z.literal("")),
    isFundamental: z.boolean().optional().default(false),
  })).optional().default([]),
});

type AiResponse = z.infer<typeof AiResponseSchema>;

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

  const pendingExperts = await expertsCollection.find({ isEnriched: { $ne: true } }).limit(BATCH_SIZE).toArray();

  if (pendingExperts.length === 0) {
    console.log("No pending experts to enrich! Phase 2 is complete.");
    process.exit(0);
  }

  console.log(`Found pending experts. Processing batch of ${pendingExperts.length}...`);

  for (const expert of pendingExperts) {
    console.log(`
-----------------------------------`);
    console.log(`Investigating: ${expert.name} (Cohort ${expert.cohort}, ${expert.sector || 'Unknown Sector'})`);
    
    try {
      const prompt = `Actúa como un Investigador Experto y Documentalista. Queremos construir la base de datos de un Sistema Experto de Conocimiento.
Tu tarea es investigar a profundidad y extraer la mayor cantidad posible de conocimiento sobre:

Nombre: ${expert.name}
Título/cargo HISTÓRICO (muy antiguo): ${expert.title || 'N/A'}
Sector: ${expert.sector || 'N/A'}
Contexto: Fue parte del Programa LEAD-México del Colegio de México en la Cohorte ${expert.cohort}. Es un experto/a en Desarrollo Sustentable, Medio Ambiente o áreas afines en México o Latinoamérica.

INSTRUCCIONES DE TONO Y ESTILO:
- Escribe con un tono neutral, profesional y accesible. NO uses lenguaje elitista ni rimbombante.
- NO menciones el Programa LEAD-México ni a El Colegio de México en la biografía. Menciona su participación solo brevemente si es relevante, no como el centro de su trayectoria. Evita frases como "gracias al programa se posicionó...".

INSTRUCCIONES:
1. **Actualización de Perfil**: El cargo histórico provisto es viejo. Investiga a qué se dedica actualmente, su afiliación institucional más reciente y define su "currentTitle". Si el título histórico indica FINADO/A o falleció, indícalo.
2. **Biografía y Aportaciones**: Redacta una biografía detallada (aprox. 300 palabras) sobre su trayectoria, impacto de sus ideas, qué análisis o tesis defiende, y cómo ha contribuido a su campo. Sigue estrictamente las instrucciones de tono y estilo. Si la persona es finada, redacta en tiempo pasado lo que puedas deducir de su trayectoria.
3. **Obras, Publicaciones y Trabajos (references)**: Investiga exhaustivamente y lista entre **5 y 8 obras**. Incluye libros, artículos, tesis, entrevistas, videos, etc. Organízalas por importancia, poniendo primero las fundamentales.
   - Marca \`isFundamental: true\` para las 2 o 3 obras más reconocidas e importantes.
   - Intenta deducir el \`year\` de publicación y extraer \`keywords\`.
   - Si es un libro y encuentras el \`isbn\`, inclúyelo.

REGLA DE ORO CONTRA ALUCINACIONES:
- SOLO devuelve enlaces (LinkedIn, Website, etc) si estás 100% seguro de que son reales.
- Para las obras, si no tienes la URL exacta y verificada, deja el campo vacío (""). NO inventes enlaces.

REGLA DE FORMATO: Devuelve la información estructurada estrictamente en un bloque de código JSON (empezando con \`\`\`json y terminando con \`\`\`).
NO devuelvas texto fuera del bloque JSON.

Estructura JSON esperada:
{
  "bio": "...",
  "currentTitle": "...",
  "topics": ["...", "..."],
  "links": {
    "linkedin": "...",
    "twitter": "...",
    "website": "...",
    "organizationName": "...",
    "organizationUrl": "..."
  },
  "references": [
    {
      "title": "...",
      "type": "video|article|book|thesis|interview|social|website|other",
      "description": "...",
      "year": 2024,
      "keywords": ["...", "..."],
      "isbn": "...",
      "isFundamental": true
    }
  ]
}
`;

      const result = await searchModel.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.1, // Baja temperatura para más determinismo
        },
      });

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
         await expertsCollection.updateOne({ _id: expert._id }, { $set: { error: "Empty response" } });
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

      let enrichedData: AiResponse;
      try {
        const parsed = JSON.parse(jsonString);
        const validated = AiResponseSchema.safeParse(parsed);
        
        if (!validated.success) {
          console.error("Validation failed for", expert.name, validated.error.format());
          await expertsCollection.updateOne({ _id: expert._id }, { $set: { error: "Zod Validation Error" } });
          continue;
        }
        
        enrichedData = validated.data;
      } catch (parseError) {
        console.error("Failed to parse JSON for", expert.name);
        console.error("Raw Output:", responseText.substring(0, 200) + "...");
        await expertsCollection.updateOne({ _id: expert._id }, { $set: { error: "JSON Parse Error: " + (parseError as Error).message } });
        continue; 
      }

      // 2. Generar Embedding para la biografía principal
      console.log(`- Generating embedding for bio...`);
      const bioEmbedding = enrichedData.bio ? await generateEmbedding(enrichedData.bio) : [];

      // Marcar las referencias como generadas por IA y asegurar tipos correctos
      const validReferenceTypes = ["video", "article", "book", "social", "website", "other", "thesis", "interview"];
      const references: Reference[] = (enrichedData.references || []).map((ref) => ({
          ...ref,
          _id: new ObjectId().toHexString(), // Generar ID único para la subdocumentación
          keywords: ref.keywords || [],
          isFundamental: ref.isFundamental || false,
          isAiGenerated: true,
          isValidated: false,
          url: "", // Se mantiene vacío según REGLA DE ORO a menos que se quiera habilitar búsqueda de URLs
          type: (validReferenceTypes.includes(ref.type) ? ref.type : "other") as Reference["type"],
      }));

      // 3. Preparar los datos actualizados del experto
      const updateData: Partial<Expert> = {
        isEnriched: true,
        isValidated: false, // Requiere validación manual
        isAiGenerated: true,
        currentTitle: enrichedData.currentTitle,
        bio: enrichedData.bio,
        topics: enrichedData.topics || [],
        links: enrichedData.links ? {
          linkedin: enrichedData.links.linkedin || "",
          twitter: enrichedData.links.twitter || "",
          website: enrichedData.links.website || "",
          organizationName: enrichedData.links.organizationName || "",
          organizationUrl: enrichedData.links.organizationUrl || "",
        } : {},
        references: references,
        embedding: bioEmbedding.length > 0 ? bioEmbedding : undefined,
      };

      // 4. Actualizar el documento en MongoDB
      await expertsCollection.updateOne(
        { _id: expert._id },
        { $set: updateData }
      );

      console.log(`- Expert profile updated in DB. ✅ Completed: ${expert.name}`);
      
    } catch (error) {
      console.error(`❌ Error processing expert ${expert.name}:`, error);
    }

    // Esperar un poco antes de la siguiente petición para respetar rate limits
    await delay(DELAY_MS);
  }

  console.log(`
Batch complete. Run the script again to process the next batch of ${BATCH_SIZE}.`);
  process.exit(0);
}

main();
