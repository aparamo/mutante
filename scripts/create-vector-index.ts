import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("mutante");
    const collection = db.collection("citations");

    console.log("Creating Vector Search Index...");
    
    // We attempt to create the search index programmatically
    const result = await collection.createSearchIndex({
      name: "vector_index",
      definition: {
        "mappings": {
          "dynamic": true,
          "fields": {
            "embedding": {
              "dimensions": 768,
              "similarity": "cosine",
              "type": "knnVector"
            }
          }
        }
      }
    });

    console.log("Search Index created. Result:", result);

  } catch (error) {
    console.error("Error creating index programmatically:", error);
  } finally {
    await client.close();
  }
}

main();
