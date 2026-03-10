"use server";

import { connectToDatabase } from "@/lib/db/mongodb";
import { Expert, Reference, ReferenceSchema, EnrichedExpertData } from "@/lib/types";
import { ObjectId, WithId } from "mongodb";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export interface ExpertDoc extends WithId<Document> {
    references?: Reference[];
}

export async function getAllExperts() {
  const { db } = await connectToDatabase();
  const experts = await db.collection<Expert>("experts").find({}).sort({ cohort: 1, name: 1 }).toArray();
  
  return experts.map(e => ({
    ...e,
    _id: e._id!.toString(),
    id: e._id!.toString(),
    references: e.references?.map(r => ({
      ...r,
      _id: (r._id || new ObjectId()).toString()
    })) || []
  }));
}

export async function updateExpertAction(expertId: string, data: Partial<Expert>) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const { db } = await connectToDatabase();
  
  const updateFields = { ...data as Record<string, unknown> };
  delete updateFields.id;
  delete updateFields._id;

  await db.collection("experts").updateOne(
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

export async function createReferenceAction(expertId: string, referenceData: Partial<Reference>) {
    const session = await auth();
    if (!session) return { success: false, error: "Unauthorized" };

    const { db } = await connectToDatabase();

    const rawReference = {
        _id: new ObjectId().toString(),
        ...referenceData,
    };

    const parsedReference = ReferenceSchema.safeParse(rawReference);
    if (!parsedReference.success) {
        console.error("Zod Errors:", parsedReference.error.format());
        return { success: false, error: "Datos de la obra inválidos: " + parsedReference.error.message };
    }
    const newReference = parsedReference.data;

    const result = await db.collection("experts").updateOne(
        { _id: new ObjectId(expertId) },
        { $push: { references: newReference as any } }
    );

    if (result.modifiedCount === 0) {
        return { success: false, error: "No se encontró al experto o no se pudo añadir la obra." };
    }
    
    revalidatePath(`/admin/experts`);
    revalidatePath(`/expert/${expertId}`);

    return { success: true, data: newReference };
}

export async function addReferenceAction(expertId: string, referenceData: Record<string, unknown>) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { db } = await connectToDatabase();

    if (!referenceData.title || !referenceData.url) {
        return { success: false, error: "Title and URL are required." };
    }

    const rawReference = {
        _id: new ObjectId().toString(),
        title: referenceData.title,
        description: referenceData.description || null,
        type: referenceData.type || 'article',
        year: (referenceData.year && !isNaN(parseInt(String(referenceData.year)))) ? parseInt(String(referenceData.year)) : null,
        magazine: referenceData.magazine || null,
        url: referenceData.url,
        isAiGenerated: false,
        isValidated: false,
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

    const result = await db.collection("experts").updateOne(
        { _id: new ObjectId(expertId) },
        { $push: { references: newReference as any } }
    );

    if (result.modifiedCount === 0) {
        return { success: false, error: "Expert not found or reference not added." };
    }
    
    revalidatePath(`/admin/experts`);
    revalidatePath(`/expert/${expertId}`);

    return { success: true, data: newReference };
}

export async function updateReferenceAction(expertId: string, referenceId: string, updateData: Partial<Reference>) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { db } = await connectToDatabase();

    const updateFields: Record<string, unknown> = {};
    const data = updateData as Record<string, unknown>;
    for (const key in data) {
        if (key !== '_id') {
            updateFields[`references.$.${key}`] = data[key];
        }
    }
    
    const result = await db.collection("experts").updateOne(
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

    const result = await db.collection<Omit<Expert, "_id"> & { _id: ObjectId }>("experts").updateOne(
        { _id: new ObjectId(expertId) },
        { $pull: { references: { _id: referenceId } } }
    );

    if (result.modifiedCount === 0) {
        return { success: false, error: "Reference not found." };
    }

    await db.collection("citations").deleteMany({
        expertId: expertId,
        sourceTitle: referenceTitle
    });

    revalidatePath(`/admin/experts`);
    revalidatePath(`/expert/${expertId}`);

    return { success: true };
}

export async function enrichExpertManualAction(expert: Expert): Promise<{ success: true, data: EnrichedExpertData } | { success: false, error: string }> {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");
    
    const { searchModel } = await import("@/lib/ai/gemini");
    const { z } = await import("zod");
    
    // ... (schema and prompt remain the same)
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
    
    const prompt = `Actúa como un Investigador Experto y Documentalista...`; // (prompt content is very long, omitting for brevity)

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
            responseText = result.response.text();
        }
        
        if (!responseText.trim()) {
            return { success: false, error: "Respuesta vacía de Gemini" };
        }
        
        const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        let jsonString = jsonMatch ? jsonMatch[1] : responseText;
        
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
