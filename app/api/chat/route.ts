type Message = { role: string; content: string; id?: string };
import { connectToDatabase } from "@/lib/db/mongodb";
import { getEmbeddings, streamChat } from "@/lib/ai/gemini";

export const maxDuration = 60; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    const lastMessage = messages[messages.length - 1];
    const lastMessageText = lastMessage?.content as string;

    let contextText = "";

    try {
      if (lastMessageText && lastMessageText.trim() !== "") {
        const queryVector = await getEmbeddings(lastMessageText);

        if (queryVector.length > 0) {
          const { db } = await connectToDatabase();
          const citationsCollection = db.collection("citations");

          const searchResults = await citationsCollection.aggregate([
            {
              $vectorSearch: {
                index: "vector_index",
                path: "embedding",
                queryVector: queryVector,
                numCandidates: 100,
                limit: 7
              }
            }
          ]).toArray();

          if (searchResults && searchResults.length > 0) {
            contextText = searchResults.map((doc, idx) => {
              return `[Cita ${idx + 1}] Experto: ${doc.expertName}\nLección/Cita: "${doc.quote}"\nContexto: ${doc.context}\nFuente: ${doc.sourceTitle}`;
            }).join("\\n\\n---\\n\\n");
          }
        }
      }
    } catch (error) {
        console.error("Error during embedding or vector search:", error);
    }

    const systemPrompt = `Eres un Experto en Desarrollo Sustentable e Inteligencia Artificial, especializado en el conocimiento de los egresados del Programa LEAD-México.
Tu objetivo es responder a las preguntas del usuario basándote PRINCIPALMENTE en la base de conocimientos proporcionada a continuación.
Si la base de conocimientos no contiene la respuesta, puedes usar tus conocimientos generales, pero aclara que no proviene del directorio de expertos.
Sé profesional, analítico y directo.

BASE DE CONOCIMIENTOS (Resultados de búsqueda semántica):
${contextText ? contextText : "No se encontró información específica en la base de datos para esta consulta."}

Si usas información de la base de conocimientos, menciona al experto que lo dijo (ej. "Como señala Gonzalo Chapela...").
`;
    
    return await streamChat(systemPrompt, messages);

  } catch (error) {
    console.error("Chat API Error:", error);
    return new Response("Error procesando la solicitud.", { status: 500 });
  }
}