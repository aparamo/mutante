import { connectToDatabase } from "../../lib/db/mongodb";

async function main() {
  const { db } = await connectToDatabase();
  const experts = await db.collection("experts").find({}).toArray();
  let validatedCount = 0;
  for (const exp of experts) {
    if (exp.references && exp.references.length > 0) {
        for (const ref of exp.references) {
            if (ref.textContent || ref.isValidated) {
                validatedCount++;
            }
        }
    }
  }
  console.log(`References with textContent/validated: ${validatedCount}`);
  process.exit(0);
}
main();