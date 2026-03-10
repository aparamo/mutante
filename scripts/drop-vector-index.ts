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

    console.log("Checking for existing Search Indexes...");
    const indexes = await collection.listSearchIndexes().toArray();
    const vectorIndex = indexes.find(idx => idx.name === "vector_index");

    if (vectorIndex) {
      console.log("Deleting 'vector_index'...");
      await collection.dropSearchIndex("vector_index");
      console.log("Index deleted successfully.");
    } else {
      console.log("Index 'vector_index' not found.");
    }

  } catch (error) {
    console.error("Error dropping index:", error);
  } finally {
    await client.close();
  }
}

main();
