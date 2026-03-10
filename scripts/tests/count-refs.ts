import { connectToDatabase } from "../../lib/db/mongodb";

async function main() {
  const { db } = await connectToDatabase();
  const experts = await db.collection("experts").find({}).toArray();
  let refCount = 0;
  let expertsWithRefs = 0;
  for (const exp of experts) {
    if (exp.references && exp.references.length > 0) {
        expertsWithRefs++;
        refCount += exp.references.length;
    }
  }
  console.log(`Experts with refs: ${expertsWithRefs}, Total refs: ${refCount}`);
  process.exit(0);
}
main();
