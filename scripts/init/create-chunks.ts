import { connectToDatabase } from "../../lib/db/mongodb";
import { getEmbeddings } from "../../lib/ai/gemini";
import { Expert, Chunk } from "../../lib/types";
import { ObjectId } from "mongodb";

async function main() {
  const { db } = await connectToDatabase();
  const expertsCollection = db.collection("experts");
  const chunksCollection = db.collection<Chunk>("chunks");

  console.log("Clearing old chunks...");
  await chunksCollection.deleteMany({});

  console.log("Fetching experts to chunk their references...");
  const experts = await expertsCollection.find({ "references.textContent": { $exists: true, $ne: "" } }).toArray() as unknown as Expert[];

  console.log(`Found ${experts.length} experts with content.`);

  for (const expert of experts) {
    if (!expert.references) continue;

    for (const ref of expert.references) {
      if (!ref.textContent) continue;

      console.log(`Chunking: ${ref.title}`);
      const text = ref.textContent;
      const chunkSize = 1500;
      const overlap = 200;
      
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize - overlap) {
        chunks.push(text.substring(i, i + chunkSize));
        if (i + chunkSize >= text.length) break;
      }

      console.log(`Generated ${chunks.length} chunks for: ${ref.title}`);

      for (let i = 0; i < chunks.length; i++) {
        const content = chunks[i];
        try {
          // Add metadata to the content to give the embedding better context
          const textForEmbedding = `Experto: ${expert.name}. Obra: ${ref.title}. Contenido: ${content}`;
          const embedding = await getEmbeddings(textForEmbedding);
          
          const chunkDoc: Chunk = {
            expertId: (expert._id || expert.id)!.toString(),
            expertName: expert.name,
            referenceId: ref._id!.toString(),
            sourceTitle: ref.title,
            content: content,
            embedding: embedding,
            order: i
          };
          
          await chunksCollection.insertOne(chunkDoc);
          if (i % 10 === 0) console.log(`Processed chunk ${i}/${chunks.length}`);
        } catch (e) {
          console.error(`Failed chunk ${i} for ${ref.title}:`, (e as Error).message);
        }
      }
    }
  }

  console.log("Chunking complete!");
  process.exit(0);
}

main().catch(console.error);
