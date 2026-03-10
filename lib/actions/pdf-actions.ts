"use server";

import { auth } from "@/auth";
import { connectToDatabase } from "@/lib/db/mongodb";
import fs from "fs/promises";
import path from "path";
import PDFParser from "pdf2json";
import { ObjectId } from "mongodb";
import { Expert, ReferenceSchema } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { ExpertDoc } from "./expert-actions";

import { searchModel } from "@/lib/ai/gemini";

// This action triggers our local server to download the PDF, parse it, and save the markdown.
export async function downloadAndParsePdfAction(expertId: string, referenceId: string, providedUrl?: string) {
    const session = await auth();
    if (!session) {
        throw new Error("Unauthorized");
    }

    const { db } = await connectToDatabase();
    
    // Find the expert and the specific reference
    const expert = await db.collection("experts").findOne({ 
        _id: new ObjectId(expertId),
        "references._id": referenceId
    }, {
        projection: {
            name: 1,
            references: { $elemMatch: { _id: referenceId } }
        }
    }) as unknown as Expert | null;

    const reference = expert?.references?.[0];
    const targetUrl = providedUrl || reference?.url;

    if (!expert || !reference || !targetUrl) {
        return { success: false, error: "Expert or reference not found, or reference has no URL." };
    }

    try {
        console.log(`Downloading ${targetUrl}...`);
        const response = await fetch(targetUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const buffer = Buffer.from(await response.arrayBuffer());
        
        console.log(`Parsing PDF...`);
        
        const pdfParser = new PDFParser(null, true);
        const textContent = await new Promise<string>((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", (errData: unknown) => reject((errData as { parserError: Error }).parserError));
            pdfParser.on("pdfParser_dataReady", () => {
                 let text = pdfParser.getRawTextContent();
                 text = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/ {2,}/g, " ").replace(/\n{3,}/g, "\n\n");
                 resolve(text);
            });
            pdfParser.parseBuffer(buffer);
        });

        // Update the expert's reference in MongoDB to mark it as validated and set the textContent
        await db.collection("experts").updateOne(
            { 
              _id: new ObjectId(expertId),
              "references._id": referenceId
            },
            { 
              $set: { 
                "references.$.markdownPath": null,
                "references.$.isValidated": true,
                "references.$.url": targetUrl,
                "references.$.pdfUrl": targetUrl,
                "references.$.textContent": textContent
              } 
            }
        );

        const updatedReference = {
            ...reference,
            markdownPath: null,
            isValidated: true,
            url: targetUrl,
            pdfUrl: targetUrl,
            textContent: textContent,
        };
        
        // Sanitize the data for the client
        const sanitizedData = {
            ...updatedReference,
            _id: updatedReference._id!
        };

        return { success: true, data: sanitizedData };
    } catch (e) {
        console.error(e);
        let errorMessage = (e as Error).message;
        const errorWithCause = e as Error & { cause?: { code?: string; reason?: string } };

        if (errorWithCause.cause?.code === 'ERR_TLS_CERT_ALTNAME_INVALID') {
            const urlHostname = new URL(targetUrl).hostname;
            errorMessage = `Error de seguridad (TLS): La URL del PDF ('${urlHostname}') no coincide con el certificado del servidor. Intenta encontrar una URL que utilice el nombre de dominio (ej. www.unam.mx) en lugar de la dirección IP si es el caso. El error original fue: ${errorWithCause.cause.reason}`;
        } else if (e instanceof TypeError && (e as Error).message.includes('fetch failed')) {
            errorMessage = `Error de descarga: No se pudo acceder a la URL del PDF ('${targetUrl}'). Podría estar mal escrita, la página no existe, o hay un problema de red.`
        }

        return { success: false, error: errorMessage };
    }
}
// Action to use Google Search Grounding to automatically find the PDF URL
export async function autoFindPdfUrlAction(authorName: string, referenceTitle: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const prompt = `Busca en internet el archivo PDF del documento/libro "${referenceTitle}" del autor "${authorName}".
Devuelve SOLO un JSON con este formato exacto:
{
  "found": true o false,
  "url": "la url directa al archivo .pdf si lo encuentras, o cadena vacía",
  "title": "El título de la página o documento encontrado",
  "source": "el nombre del sitio web donde lo encontraste"
}
Asegúrate de que la URL sea un enlace de descarga directa y de preferencia termine en .pdf o sea de un repositorio académico.
NO DEVUELVAS NADA MÁS QUE EL JSON. NO uses formato markdown (no pongas \`\`\`json).`;

    try {
        const result = await searchModel.generateContent(prompt);
        let responseText = result.response.text();
        
        // Clean markdown backticks just in case
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        const data = JSON.parse(responseText);
        return { success: true, data };
    } catch (e) {
        console.error("Error in autoFindPdfUrlAction:", e);
        return { success: false, error: (e as Error).message };
    }
}


// Action to discover new publications for an expert
export async function findExpertPublicationsAction(expertName: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const prompt = `Actúa como un bibliotecario de investigación. Tu objetivo es encontrar hasta 5 publicaciones (libros, artículos, papers) en formato PDF del autor "${expertName}".
Para cada resultado que encuentres, extrae la siguiente información:
- title: El título completo y correcto del documento.
- description: Un resumen o abstract de 1-2 frases sobre el contenido.
- year: El año de publicación (como string). Si no lo encuentras, usa una cadena vacía.
- url: La URL directa al archivo PDF. Esta URL DEBE terminar en .pdf.

IMPORTANTE: Da alta prioridad a URLs que usen un nombre de dominio (ej. https://www.pued.unam.mx/libro.pdf) sobre las que usen una dirección IP. Sin embargo, si la única fuente disponible es una IP, inclúyela.

Devuelve los resultados como un array de objetos JSON. El formato debe ser estrictamente:
[
  { "title": "...", "description": "...", "year": "...", "url": "..." },
  { "title": "...", "description": "...", "year": "...", "url": "..." }
]

Si no encuentras ningún PDF, devuelve un array vacío [].
NO incluyas resultados que no tengan una URL directa a un PDF.
NO devuelvas nada más que el array JSON. NO uses formato markdown (no pongas \`\`\`json).`;

    try {
        const result = await searchModel.generateContent(prompt);
        let responseText = result.response.text();
        
        // Clean markdown backticks just in case
        responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
        
        // Handle cases where the model might return a single object instead of an array
        if (responseText.startsWith("{")) {
            responseText = `[${responseText}]`;
        }
        
        // If the response is empty after cleaning, it means no results were found.
        if (!responseText) {
            return { success: true, data: [] };
        }

        const data = JSON.parse(responseText);
        return { success: true, data };

    } catch (e) {
        console.error("Error in findExpertPublicationsAction:", e);
        // Try to return a more informative error if JSON parsing fails
        if (e instanceof SyntaxError) {
             return { success: false, error: "La respuesta de la IA no tenía un formato JSON válido." };
        }
        return { success: false, error: (e as Error).message };
    }
}

// Action to process a manually provided PDF (via URL or upload), extract metadata, and add it
export async function processAndAddReferenceAction(expertId: string, pdfUrl: string) {
    const session = await auth();
    if (!session) throw new Error("Unauthorized");

    const { db } = await connectToDatabase();
    const expert = await db.collection("experts").findOne({ _id: new ObjectId(expertId) }) as unknown as Expert | null;
    if (!expert) throw new Error("Expert not found");

    try {
        // 1. Download the PDF (in memory)
        console.log(`Downloading ${pdfUrl} for processing...`);
        const response = await fetch(pdfUrl);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const buffer = Buffer.from(await response.arrayBuffer());

        // 2. Extract Text Content
        const pdfParser = new PDFParser(null, true);
        const textContent = await new Promise<string>((resolve, reject) => {
            pdfParser.on("pdfParser_dataError", (errData: unknown) => reject((errData as { parserError: Error }).parserError));
            pdfParser.on("pdfParser_dataReady", () => {
                let text = pdfParser.getRawTextContent();
                text = text.replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/ {2,}/g, " ").replace(/\n{3,}/g, "\n\n");
                resolve(text);
            });
            pdfParser.parseBuffer(buffer);
        });

        if (!textContent) {
            throw new Error("Could not extract text from PDF.");
        }

        // 3. Use AI to extract metadata
        const metadataPrompt = `Analiza las primeras 2-3 páginas de este texto extraído de un documento académico o libro y devuelve sus metadatos.
TEXTO:
---
${textContent.substring(0, 5000)}
---
Extrae la siguiente información:
- title: El título principal del documento.
- year: El año de publicación.
- description: Un resumen corto (1-2 frases).
- magazine: Si es un artículo de revista, el nombre de la revista.
- fullCitation: La citación bibliográfica completa en formato APA 7 o Harvard. Incluye autores, año, título, y fuente (revista, editorial, etc.).

Devuelve SOLO un objeto JSON con el formato exacto:
{ "title": "...", "year": "...", "description": "...", "magazine": "...", "fullCitation": "..." }
No uses markdown. Si un campo no se encuentra, usa una cadena vacía.`;

        const result = await searchModel.generateContent(metadataPrompt);
        const responseText = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
        const metadata = JSON.parse(responseText);

        // 4. Create reference object
        const rawReference = {
            _id: new ObjectId().toString(),
            title: metadata.title,
            description: metadata.description || null,
            type: metadata.magazine ? 'article' : 'book', // Infer type
            year: (metadata.year && !isNaN(parseInt(String(metadata.year)))) ? parseInt(String(metadata.year)) : null,
            magazine: metadata.magazine || null,
            fullCitation: metadata.fullCitation || null,
            url: pdfUrl,
            isAiGenerated: false,
            isValidated: true,
            isFundamental: false,
            keywords: [],
            pdfUrl: pdfUrl,
            markdownPath: null,
            textContent: textContent, // Store the full text
        };

        const parsedReference = ReferenceSchema.safeParse(rawReference);
        if (!parsedReference.success) {
            throw new Error("Invalid reference data: " + parsedReference.error.message);
        }
        const newReference = parsedReference.data;

        // 5. Add to database
        const updateResult = await db.collection<ExpertDoc>("experts").updateOne(
            { _id: new ObjectId(expertId) },
            { $push: { references: newReference } }
        );
        if (updateResult.modifiedCount === 0) throw new Error("Could not add reference to expert.");

        revalidatePath(`/admin/experts`);
        revalidatePath(`/expert/${expertId}`);
        
        return { success: true, data: { ...newReference, _id: newReference._id! }};

    } catch (e) {
        console.error(e);
        return { success: false, error: (e as Error).message };
    }
}
