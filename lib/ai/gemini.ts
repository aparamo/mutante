import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not defined in the environment.");
}

export const genAI = new GoogleGenerativeAI(apiKey);

// Modelo para búsqueda y extracción (Fase 2)
// Usamos flash porque es rápido y económico, ideal para procesar cientos de registros.
export const searchModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [
    {
      // Habilitamos la búsqueda en Google para que la IA traiga datos reales y actualizados
      googleSearch: {}, 
    },
  ],
});

// Modelo para embeddings (Fase 3 y búsquedas vectoriales)
export const embeddingModel = genAI.getGenerativeModel({
  model: "gemini-embedding-001",
});
