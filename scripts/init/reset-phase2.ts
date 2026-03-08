import { connectToDatabase } from "../../lib/db/mongodb";
import { config } from "dotenv";

config();

async function main() {
  console.log("Full Reset: Deleting all experts and citations...");
  try {
    const { db } = await connectToDatabase();
    
    const deleteExpertsResult = await db.collection("experts").deleteMany({});
    console.log(`Deleted ${deleteExpertsResult.deletedCount} experts.`);

    const deleteCitationsResult = await db.collection("citations").deleteMany({});
    console.log(`Deleted ${deleteCitationsResult.deletedCount} citations.`);

    console.log("Database reset complete. Ready to seed from scratch.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting database:", error);
    process.exit(1);
  }
}

main();