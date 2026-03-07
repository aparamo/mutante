import { google } from "@ai-sdk/google";
import { streamText, Message } from "ai";
import { connectToDatabase } from "@/lib/db/mongodb";
import { embeddingModel } from "@/lib/ai/gemini";

// Configuración de la API Route
export const maxDuration = 60; // Permitir que la respuesta tome hasta 60s
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    // Obtenemos la última pregunta del usuario
    const lastMessage = messages[messages.length - 1];

    // 1. Convertimos la pregunta del usuario a un vector (Embedding)
    let queryVector: number[] = [];
    try {
      const embedResult = await embeddingModel.embedContent(lastMessage.content);
      queryVector = embedResult.embedding.values;
    } catch (error) {
      console.error("Error generating embedding for query:", error);
      // Fallback: si falla el embedding, respondemos sin contexto de la DB
    }

    let contextText = "";

    // 2. Buscamos en MongoDB (Vector Search) si tenemos un vector
    if (queryVector.length > 0) {
      const { db } = await connectToDatabase();
      const citationsCollection = db.collection("citations");

      try {
        // NOTA: Esto requiere que un Atlas Vector Search Index llamado "vector_index" esté configurado.
        const searchResults = await citationsCollection.aggregate([
          {
            $vectorSearch: {
              index: "vector_index",
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 20,
              limit: 5
            }
          }
        ]).toArray();

        if (searchResults && searchResults.length > 0) {
          contextText = searchResults.map((doc, idx) => {
            return `[Cita ${idx + 1}] Experto: ${doc.expertName}\nLección/Cita: "${doc.quote}"\nContexto: ${doc.context}\nFuente: ${doc.sourceTitle}`;
          }).join("\n\n");
        }
      } catch (error) {
        console.error("Vector search failed. Did you create the Atlas Vector Search Index?", error);
        // Si falla la búsqueda vectorial (ej. no está configurado el índice), continuamos sin contexto
      }
    }

    // 3. Preparamos el Prompt de Sistema (System Instruction)
    const systemPrompt = `Eres un Experto en Desarrollo Sustentable e Inteligencia Artificial, especializado en el conocimiento de los egresados del Programa LEAD-México.
Tu objetivo es responder a las preguntas del usuario basándote PRINCIPALMENTE en la base de conocimientos proporcionada a continuación.
Si la base de conocimientos no contiene la respuesta, puedes usar tus conocimientos generales, pero aclara que no proviene del directorio de expertos.
Sé profesional, analítico y directo.

BASE DE CONOCIMIENTOS (Resultados de búsqueda semántica):
${contextText ? contextText : "No se encontró información específica en la base de datos para esta consulta."}

Si usas información de la base de conocimientos, menciona al experto que lo dijo (ej. "Como señala Gonzalo Chapela...").
`;

    // 4. Generamos y transmitimos la respuesta usando Gemini
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Error procesando la solicitud.", { status: 500 });
  }
}
