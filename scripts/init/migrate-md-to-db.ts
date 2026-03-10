import { connectToDatabase } from "../../lib/db/mongodb";
import { Expert } from "../../lib/types";
import fs from "fs/promises";
import path from "path";
import { ObjectId } from "mongodb";

async function main() {
  const { db } = await connectToDatabase();
  const expertsCollection = db.collection("experts");

  // Query corrected for array of objects
  const experts = await expertsCollection.find({ 
    "references": { 
      $elemMatch: { 
        "markdownPath": { $exists: true, $ne: null }
      } 
    } 
  }).toArray() as unknown as Expert[];

  console.log(`Found ${experts.length} experts with potential markdown files.`);

  for (const expert of experts) {
    if (!expert.references) continue;

    for (const ref of expert.references) {
      if (ref.markdownPath && !ref.textContent) {
        const absolutePath = path.join(process.cwd(), "public", ref.markdownPath);
        
        try {
          const content = await fs.readFile(absolutePath, "utf-8");
          await expertsCollection.updateOne(
            { _id: expert._id ? new ObjectId(expert._id) : expert.id, "references._id": ref._id },
            { $set: { "references.$.textContent": content } }
          );
          console.log(`Migrated: ${ref.title}`);
        } catch (e) {
          console.log(`Skip (file not found or error): ${ref.markdownPath}`);
        }
      } else if (ref.textContent) {
        console.log(`Already has textContent: ${ref.title.substring(0, 30)}...`);
      }
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

main().catch(console.error);
