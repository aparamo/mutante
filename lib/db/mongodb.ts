import { MongoClient, Db } from "mongodb";

// Module-level variables to hold the database connection.
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  // If the connection is already cached, return it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Ensure MONGODB_URI is provided
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
  }

  // Ensure MONGODB_DB is provided (or fallback to default name)
  const dbName = process.env.MONGODB_DB || "mutante";

  try {
    // Create a new MongoClient
    const client = new MongoClient(uri);

    // Connect to the MongoDB cluster
    await client.connect();

    // Select the database
    const db = client.db(dbName);

    // Cache the connection
    cachedClient = client;
    cachedDb = db;

    console.log(`Successfully connected to database: ${dbName}`);
    return { client, db };
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    throw error;
  }
}
