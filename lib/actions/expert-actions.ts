"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import { Expert, Reference, ReferenceSchema, EnrichedExpertData } from "@/lib/types";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface ExpertDoc {
    _id: ObjectId;
    references?: Reference[];
}

export async function getAllExperts() {
  const { db } = await connectToDatabase();
  const experts = await db.collection<Expert>("experts").find({}).sort({ cohort: 1, name: 1 }).toArray();
  
  // Sanitize the data for Client Components. This is critical for preventing crashes.
  return experts.map(e => ({
    ...e,
    _id: e._id!.toString(),
    id: e._id!.toString(),
    references: e.references?.map(r => ({
      ...r,
      // If r._id exists, use it. If not, the data is corrupted (missing ObjectId).
      // We generate a new one here to prevent the client from crashing.
      // The real fix is a data migration script to add missing _ids in the DB.
      _id: (r._id || new ObjectId()).toString()
    })) || []
  }));
}

export async function updateExpertAction(expertId: string, data: Partial<Expert>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { db } = await connectToDatabase();
  
  const updateFields = { ...data as Record<string, unknown> };
  // Delete id and _id if they exist to avoid MongoDB error
  delete updateFields.id;
  delete updateFields._id;

  await db.collection<ExpertDoc>("experts").updateOne(
    { _id: new ObjectId(expertId) },
    { $set: updateFields }
  );
  
  revalidatePath("/admin/experts");
  return { success: true };
}

export async function deleteExpertAction(expertId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { db } = await connectToDatabase();
  
  await db.collection("experts").deleteOne({ _id: new ObjectId(expertId) });
  await db.collection("citations").deleteMany({ expertId: expertId });
  
  revalidatePath("/admin/experts");
  return { success: true };
}

export async function addReferenceAction(expertId: string, referenceData: Record<string, unknown>) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { db } = await connectToDatabase();

    // Basic validation
    if (!referenceData.title || !referenceData.url) {
        return { success: false, error: "Title and URL are required." };
    }

    // Create a new reference object that adheres to our schema
    const rawReference = {
        _id: new ObjectId().toString(), // CRITICAL: Assign a unique ID to the sub-document
        title: referenceData.title,
        description: referenceData.description || null,
        type: referenceData.type || 'article', // Default type
        year: (referenceData.year && !isNaN(parseInt(String(referenceData.year)))) ? parseInt(String(referenceData.year)) : null,
        magazine: referenceData.magazine || null, // New field
        url: referenceData.url,
        isAiGenerated: false, // It was found by AI, but added by human
        isValidated: false, // It still needs to be processed to get the markdown
        isFundamental: false,
        keywords: referenceData.keywords || [],
        pdfUrl: null,
        markdownPath: null,
    };

    const parsedReference = ReferenceSchema.safeParse(rawReference);
    if (!parsedReference.success) {
        return { success: false, error: "Invalid reference data: " + parsedReference.error.message };
    }
    const newReference = parsedReference.data;

    // Type the collection properly for the update
    interface ExpertDoc {
        _id: ObjectId;
        references?: Reference[];
    }

    const result = await db.collection<ExpertDoc>("experts").updateOne(
        { _id: new ObjectId(expertId) },
        { $push: { references: newReference } }
    );

    if (result.modifiedCount === 0) {
        return { success: false, error: "Expert not found or reference not added." };
    }
    
    revalidatePath(`/admin/experts`);
    revalidatePath(`/expert/${expertId}`);

    // Return the newly added reference so the client can update its state
    return { success: true, data: newReference };
}

export async function updateReferenceAction(expertId: string, referenceId: string, updateData: Partial<Reference>) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { db } = await connectToDatabase();

    const updateFields: Record<string, unknown> = {};
    // Build the $set object dynamically to update fields within the array element
    const data = updateData as Record<string, unknown>;
    for (const key in data) {
        if (key !== '_id') { // Don't allow changing the ID
            updateFields[`references.$.${key}`] = data[key];
        }
    }
    
    const result = await db.collection<ExpertDoc>("experts").updateOne(
        { 
            _id: new ObjectId(expertId), 
            "references._id": referenceId 
        },
        { $set: updateFields }
    );

    if (result.modifiedCount === 0) {
        return { success: false, error: "Reference not found or not updated." };
    }

    revalidatePath(`/admin/experts`);
    revalidatePath(`/expert/${expertId}`);

    return { success: true };
}

export async function deleteReferenceAction(expertId: string, referenceId: string, referenceTitle: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { db } = await connectToDatabase();

    // 1. Pull the reference from the expert's array
    const result = await db.collection<ExpertDoc>("experts").updateOne(
        { _id: new ObjectId(expertId) },
        { $pull: { references: { _id: referenceId } } }
    );

    if (result.modifiedCount === 0) {
        return { success: false, error: "Reference not found." };
    }

    // 2. Delete all associated citations (cascading delete)
    await db.collection("citations").deleteMany({
        expertId: expertId,
        sourceTitle: referenceTitle // We use title here as a safeguard
    });

    revalidatePath(`/admin/experts`);
    revalidatePath(`/expert/${expertId}`);

    return { success: true };
}

export async function enrichExpertManualAction(expert: Expert): Promise<{ success: true, data: EnrichedExpertData } | { success: false, error: string }> {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    
    // Import dynamically so it's only loaded on the server
    const { searchModel } = await import("@/lib/ai/gemini");
    const { z } = await import("zod");
    
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
1. **Actualización de Perfil**: El cargo histórico provisto es viejo. Investiga a qué se dedica actualmente, su afiliación institucional más reciente y define su "currentTitle". Si el título indica FINADO/A o falleció, indícalo.
2. **Biografía y Aportaciones**: Redacta una biografía detallada (aprox. 300 palabras) sobre su trayectoria, impacto de sus ideas, qué análisis o tesis defiende, y cómo ha contribuido a su campo. Sigue estrictamente las instrucciones de tono y estilo. Si la persona es finada, redacta en tiempo pasado.
3. **Obras, Publicaciones y Trabajos (references)**: Investiga exhaustivamente y lista entre **5 y 8 obras**. Incluye libros, artículos, tesis, entrevistas, videos, etc. Organízalas por importancia, poniendo primero las fundamentales.
   - Marca \`isFundamental: true\` para las 2 o 3 obras más reconocidas e importantes.
   - Intenta deducir el \`year\` de publicación y extraer \`keywords\`.
   - Si es un libro y encuentras el \`isbn\`, inclúyelo.

REGLA DE ORO CONTRA ALUCINACIONES:
- SOLO devuelve enlaces si estás 100% seguro de que son reales.
- Para las obras, si no tienes la URL exacta y verificada, deja el campo vacío (""). NO inventes enlaces.

REGLA DE FORMATO: Devuelve la información estructurada estrictamente en un bloque de código JSON (empezando con \`\`\`json y terminando con \`\`\`). NO devuelvas texto fuera del bloque JSON.

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
}`;

    try {
        const result = await searchModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.1,
            },
        });
        
        let responseText = "";
        if (result.response.candidates && result.response.candidates.length > 0) {
            const content = result.response.candidates[0].content;
            if (content && content.parts && content.parts.length > 0) {
                responseText = result.response.text();
            }
        }
        
        if (!responseText || responseText.trim() === "") {
            return { success: false, error: "Respuesta vacía de Gemini" };
        }
        
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        let jsonString = jsonMatch ? jsonMatch[1] : responseText;
        jsonString = jsonString.trim();
        if (!jsonString.endsWith("}")) {
            const lastBrace = jsonString.lastIndexOf("}");
            if (lastBrace !== -1) {
                jsonString = jsonString.substring(0, lastBrace + 1);
            } else {
                jsonString += "\n}"; 
            }
        }
        
        const parsed = JSON.parse(jsonString);
        const validated = AiResponseSchema.safeParse(parsed);
        
        if (!validated.success) {
            return { success: false, error: "Error de validación: " + JSON.stringify(validated.error.format()) };
        }
        
        return { success: true, data: validated.data };
    } catch (error) {
        return { success: false, error: "Error procesando IA: " + (error as Error).message };
    }
}
