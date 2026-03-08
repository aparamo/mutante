"use server";

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { embeddingModel, searchModel } from "@/lib/ai/gemini";
import fs from "fs/promises";
import path from "path";
import { ObjectId } from "mongodb";
import { Citation, CitationSchema, Expert } from "@/lib/types";

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

export async function extractCitationsAction(expertId: string, referenceTitle: string, markdownPath: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { db } = await connectToDatabase();
  const absolutePath = path.join(process.cwd(), "public", markdownPath);

  try {
    const content = await fs.readFile(absolutePath, "utf-8");
    const expert = await db.collection("experts").findOne({ _id: new ObjectId(expertId) }) as unknown as Expert | null;
    
    if (!expert) throw new Error("Expert not found");

    // Take a large sample or chunk it. For now, let's take the first 30k characters 
    // to avoid token limits but get enough substance.
    const textToAnalyze = content.substring(0, 40000);

    const prompt = `Actúa como un Documentalista Académico. Voy a proporcionarte el texto extraído de una obra titulada "${referenceTitle}" del experto "${expert.name}".
    
TU TAREA:
Extrae entre 5 y 10 CITAS TEXTUALES LARGAS y profundas.
- Deben ser fragmentos literales del texto (mínimo 2-3 oraciones cada una).
- Deben contener lecciones fundamentales, resultados de análisis, tesis principales o datos clave sobre desarrollo sustentable.
- NO parafrasees. Copia y pega el texto tal cual aparece.

Formato de salida: JSON estrictamente.
{
  "citations": [
    {
      "quote": "texto literal...",
      "context": "Breve explicación de por qué esta cita es fundamental",
      "topics": ["tema1", "tema2"]
    }
  ]
}

TEXTO DE LA OBRA:
${textToAnalyze}
`;

    const result = await searchModel.generateContent(prompt);
    const responseText = result.response.text();
    const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const jsonString = jsonMatch ? jsonMatch[1] : responseText;
    const { citations } = JSON.parse(jsonString);

    const citationDocs: Citation[] = [];
    for (const c of citations) {
      const citationText = `Experto: ${expert.name}. Obra: ${referenceTitle}. Cita: "${c.quote}"`;
      const embedding = await generateEmbedding(citationText);

      const rawCitation = {
        expertId: expertId,
        expertName: expert.name,
        quote: c.quote,
        sourceTitle: referenceTitle,
        sourceUrl: "", // This is from a local file
        context: c.context,
        topics: c.topics,
        embedding: embedding,
        isValidated: false,
        isAiGenerated: true,
      };

      const parsedCitation = CitationSchema.safeParse(rawCitation);
      if (parsedCitation.success) {
        citationDocs.push(parsedCitation.data);
      } else {
        console.error("Failed to parse citation:", parsedCitation.error);
      }
    }

    if (citationDocs.length > 0) {
      await db.collection("citations").insertMany(citationDocs as unknown as Document[]);
    }

    return { success: true, count: citationDocs.length };
  } catch (e) {
    console.error(e);
    return { success: false, error: (e as Error).message };
  }
}

export async function getCitationsForReferenceAction(expertId: string, referenceTitle: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    
    const { db } = await connectToDatabase();
    const citations = await db.collection<Citation>("citations").find({
        expertId: expertId,
        sourceTitle: referenceTitle
    }).toArray();

    // Sanitize for client component
    return citations.map(c => ({
        ...c,
        _id: c._id?.toString(),
        id: c._id?.toString(), // Map _id to id to prevent React key warning and match UI usage
    }));
}

export async function deleteCitationAction(citationId: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    
    const { db } = await connectToDatabase();
    const result = await db.collection("citations").deleteOne({ _id: new ObjectId(citationId) });

    if (result.deletedCount === 0) {
        return { success: false, error: "Citation not found." };
    }
    
    return { success: true };
}

export async function updateCitationAction(citationId: string, newQuote: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    
    const { db } = await connectToDatabase();
    const citation = await db.collection("citations").findOne({ _id: new ObjectId(citationId) });

    if (!citation) {
        return { success: false, error: "Citation not found." };
    }

    // Re-generate embedding for the new text
    const citationText = `Experto: ${citation.expertName}. Obra: ${citation.sourceTitle}. Cita: "${newQuote}"`;
    const newEmbedding = await generateEmbedding(citationText);

    const result = await db.collection("citations").updateOne(
        { _id: new ObjectId(citationId) },
        { $set: { quote: newQuote, embedding: newEmbedding } }
    );

     if (result.modifiedCount === 0) {
        return { success: false, error: "Failed to update citation." };
    }
    
    return { success: true };
}

// Used when a reference is deleted
export async function deleteCitationsByReferenceAction(expertId: string, referenceTitle: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    
    const { db } = await connectToDatabase();
    await db.collection("citations").deleteMany({
        expertId: expertId,
        sourceTitle: referenceTitle
    });

    return { success: true };
}
