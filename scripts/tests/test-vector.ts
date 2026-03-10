import { connectToDatabase } from "../../lib/db/mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  const { db } = await connectToDatabase();
  
  const query = "Cambio climático y maíz nativo";
  console.log(`Querying: ${query}`);

  // Get Embedding
  const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
  let result;
  try {
     result = await model.embedContent(query);
  } catch (e) {
     console.log("Failed with gemini-embedding-001", e);
     throw e;
  }
  
  const queryVector = result.embedding.values;
  console.log(`Generated vector of length: ${queryVector.length}`);

  try {
    const searchResults = await db.collection("citations").aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryVector,
          numCandidates: 100,
          limit: 3
        }
      }
    ]).toArray();

    console.log(`Found ${searchResults.length} results.`);
    searchResults.forEach((res, i) => {
        console.log(`Result ${i + 1}: ${res.quote.substring(0, 100)}...`);
    });
  } catch (e) {
      console.error("Vector search failed:", e);
  }

  process.exit(0);
}

main().catch(console.error);
