"use server";

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import { getEmbeddings, searchModel } from "@/lib/ai/gemini";
import fs from "fs/promises";
import path from "path";
import { ObjectId, OptionalId } from "mongodb";
import { Citation, CitationSchema, Expert, Reference } from "@/lib/types";

export interface WorkWithAuthor extends Reference {
  expertName: string;
  expertId: string;
}

export async function extractCitationsAction(expertId: string, referenceId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { db } = await connectToDatabase();

  try {
    const expertDoc = await db.collection("experts").findOne({ 
        _id: new ObjectId(expertId),
        "references._id": referenceId
    });
    const expert = expertDoc as unknown as Expert | null;
    
    if (!expert || !expert.references) throw new Error("Expert or reference not found");
    const reference = expert.references.find(r => r._id === referenceId);
    if (!reference || !reference.textContent) throw new Error("Reference has no text content to analyze.");

    const referenceTitle = reference.title;
    const content = reference.textContent;

    // 1. CHUNKING LOGIC FOR RAG
    const chunkSize = 1500;
    const overlap = 200;
    const chunksArray: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize - overlap) {
      chunksArray.push(content.substring(i, i + chunkSize));
      if (i + chunkSize >= content.length) break;
    }

    // Clear old chunks for this reference
    await db.collection("chunks").deleteMany({ referenceId: referenceId });

    const chunkDocs = [];
    for (let i = 0; i < chunksArray.length; i++) {
      const chunkText = chunksArray[i];
      try {
        const textForEmbedding = `Experto: ${expert.name}. Obra: ${referenceTitle}. Contenido: ${chunkText}`;
        const embedding = await getEmbeddings(textForEmbedding);
        
        chunkDocs.push({
          expertId: expertId,
          expertName: expert.name,
          referenceId: referenceId,
          sourceTitle: referenceTitle,
          content: chunkText,
          embedding: embedding,
          order: i
        });
      } catch (e) {
        console.error(`Failed to embed chunk ${i}:`, e);
      }
    }

    if (chunkDocs.length > 0) {
      await db.collection("chunks").insertMany(chunkDocs);
    }

    // 2. CITATION EXTRACTION LOGIC
    // Take a large sample or chunk it. For now, let's take the first 40k characters 
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
      const embedding = await getEmbeddings(citationText);

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
      await db.collection<Citation>("citations").insertMany(citationDocs as OptionalId<Citation>[]);
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

export async function updateCitationAction(citationId: string, newQuote: string, newPageNumber?: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    
    const { db } = await connectToDatabase();
    const citationDoc = await db.collection("citations").findOne({ _id: new ObjectId(citationId) });
    const citation = citationDoc as Citation | null;

    if (!citation) {
        return { success: false, error: "Citation not found." };
    }

    // Re-generate embedding for the new text
    const citationText = `Experto: ${citation.expertName}. Obra: ${citation.sourceTitle}. Cita: "${newQuote}"`;
    const newEmbedding = await getEmbeddings(citationText);

    const result = await db.collection("citations").updateOne(
        { _id: new ObjectId(citationId) },
        { $set: { quote: newQuote, pageNumber: newPageNumber, embedding: newEmbedding } }
    );

     if (result.modifiedCount === 0) {
        return { success: false, error: "Failed to update citation." };
    }
    
    return { success: true };
}

export async function getAllWorksAction(): Promise<WorkWithAuthor[]> {
  const { db } = await connectToDatabase();
  
  // We need to fetch experts to get their names and associate them with their references
  const expertsDocs = await db.collection("experts").find({
    "references.0": { $exists: true }
  }).toArray();
  
  const experts = expertsDocs as unknown as Expert[];

  const allWorks: WorkWithAuthor[] = experts.flatMap(expert => 
    (expert.references || []).map(ref => ({
      ...ref,
      expertName: expert.name,
      expertId: expert._id?.toString() || expert.id || ""
    }))
  );

  return allWorks;
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
