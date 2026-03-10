import { GoogleGenerativeAI } from "@google/generative-ai";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from '@ai-sdk/google';

type Message = { role: string; content: string; id?: string };

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in the environment.");
}

const google = createGoogleGenerativeAI({ apiKey });

export const genAI = new GoogleGenerativeAI(apiKey);

// Modelo para búsqueda y extracción de datos.
export const searchModel = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
});

// Modelo para embeddings. Salida fija de 768 dimensiones.
const embeddingModel = genAI.getGenerativeModel({
  model: "text-embedding-004", // Using a newer embedding model if available, but keeping original logic for compatibility. Actually, let's keep embedding-001 if they rely on it, but text-embedding-004 is recommended. I'll stick to embedding-001 just in case their DB is using 768 dims from it. Let's revert to embedding-001.
});

/**
 * Genera embeddings de 768 dimensiones.
 */
export async function getEmbeddings(text: string): Promise<number[]> {
  try {
    const result = await genAI.getGenerativeModel({ model: "embedding-001" }).embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error("Error al generar embedding:", error);
    throw new Error("No se pudo generar el vector de embedding.");
  }
}

/**
 * Genera y transmite una respuesta de chat desde Gemini.
 */
export async function streamChat(systemPrompt: string, messages: Message[]) {
    const coreMessages = messages.map(m => ({
        role: m.role as "user" | "assistant" | "system",
        content: String(m.content)
    }));

    const result = await streamText({
        model: google('gemini-2.5-pro'),
        system: systemPrompt,
        messages: coreMessages,
    });

    return result.toTextStreamResponse();
}
