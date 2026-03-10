import { connectToDatabase } from "../../lib/db/mongodb";

async function main() {
    const { db } = await connectToDatabase();
    
    const count = await db.collection("citations").countDocuments();
    console.log(`Total citations: ${count}`);

    const sample = await db.collection("citations").findOne({});
    console.log(`Sample citation:`, sample ? Object.keys(sample) : "None");
    
    process.exit(0);
}

main().catch(console.error);
