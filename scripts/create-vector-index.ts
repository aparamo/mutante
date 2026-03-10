import { MongoClient } from "mongodb";
import { config } from "dotenv";

config();

async function createIndex(db: any, collectionName: string) {
    const collection = db.collection(collectionName);
    console.log(`Creating Vector Search Index for ${collectionName}...`);
    
    try {
        const result = await collection.createSearchIndex({
          name: "vector_index",
          definition: {
            "mappings": {
              "dynamic": true,
              "fields": {
                "embedding": {
                  "dimensions": 3072,
                  "similarity": "cosine",
                  "type": "knnVector"
                }
              }
            }
          }
        });
        console.log(`Search Index created for ${collectionName}. Result:`, result);
    } catch (e) {
        console.error(`Error creating index for ${collectionName}:`, e);
    }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Missing MONGODB_URI");

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("mutante");
    
    await createIndex(db, "citations");
    await createIndex(db, "chunks");

  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    await client.close();
  }
}

main();
