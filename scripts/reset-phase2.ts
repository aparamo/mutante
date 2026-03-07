import { connectToDatabase } from "../lib/db/mongodb";
import { config } from "dotenv";

config();

async function main() {
  console.log("Resetting Phase 2 status...");
  try {
    const { db } = await connectToDatabase();
    
    // Reset isEnriched flag and remove bio, topics, links, references, embedding
    const updateResult = await db.collection("experts").updateMany(
      {},
      { 
        $set: { isEnriched: false },
        $unset: { bio: "", topics: "", links: "", references: "", embedding: "" }
      }
    );
    console.log(`Reset ${updateResult.modifiedCount} experts to pending state.`);

    // Delete all citations
    const deleteResult = await db.collection("citations").deleteMany({});
    console.log(`Deleted ${deleteResult.deletedCount} citations.`);

    console.log("Database reset complete. Ready to start from the beginning.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

main();