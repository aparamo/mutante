import { connectToDatabase } from "../../lib/db/mongodb";
import { getEmbeddings } from "../../lib/ai/gemini";
import { Citation } from "../../lib/types";
import { ObjectId } from "mongodb";

async function main() {
  const { db } = await connectToDatabase();
  const collection = db.collection<Citation>("citations");

  console.log("Fetching all citations to re-embed...");
  const citations = await collection.find({}).toArray();
  console.log(`Found ${citations.length} citations.`);

  let count = 0;
  for (const citation of citations) {
    if (!citation._id) continue;
    
    try {
      // Re-generate the text used for the original embedding
      // Following the pattern in knowledge-actions.ts:
      const citationText = `Experto: ${citation.expertName}. Obra: ${citation.sourceTitle}. Cita: "${citation.quote}"`;
      
      console.log(`[${++count}/${citations.length}] Generating 3072-dim embedding for citation: ${citation._id}`);
      const newEmbedding = await getEmbeddings(citationText);
      
      await collection.updateOne(
        { _id: new ObjectId(citation._id) },
        { $set: { embedding: newEmbedding } }
      );
    } catch (error) {
      console.error(`Failed to re-embed citation ${citation._id}:`, error);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

main().catch(console.error);
