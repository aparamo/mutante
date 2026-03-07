import { connectToDatabase } from "./lib/db/mongodb";
import { config } from "dotenv";

config();

async function main() {
    const { db } = await connectToDatabase();
    const enrichedCount = await db.collection("experts").countDocuments({ isEnriched: true });
    const pendingCount = await db.collection("experts").countDocuments({ isEnriched: { $ne: true } });
    console.log(`Enriched experts: ${enrichedCount}`);
    console.log(`Pending experts: ${pendingCount}`);
    
    // Also print the first 3 pending experts
    const pending = await db.collection("experts").find({ isEnriched: { $ne: true } }).limit(3).toArray();
    console.log("Next pending experts:");
    pending.forEach(p => console.log(`- ${p.name} (Cohort ${p.cohort})`));
    
    process.exit(0);
}
main();
