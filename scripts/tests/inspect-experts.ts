import { connectToDatabase } from "../../lib/db/mongodb";

async function main() {
  const { db } = await connectToDatabase();
  const experts = await db.collection("experts").find({ "references.0": { $exists: true } }).limit(2).toArray();
  
  console.log(JSON.stringify(experts, (key, value) => 
    key === "embedding" ? "[Vector]" : value, 2));
    
  process.exit(0);
}

main().catch(console.error);
