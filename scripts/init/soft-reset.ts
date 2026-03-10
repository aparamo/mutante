import { connectToDatabase } from "../../lib/db/mongodb";

async function main() {
  const { db } = await connectToDatabase();
  
  console.log("Starting Soft Reset of Knowledge Base...");

  // 1. Clear citations collection
  console.log("Clearing 'citations' collection...");
  const citationsResult = await db.collection("citations").deleteMany({});
  console.log(`Deleted ${citationsResult.deletedCount} citations.`);

  // 2. Clear chunks collection
  console.log("Clearing 'chunks' collection...");
  const chunksResult = await db.collection("chunks").deleteMany({});
  console.log(`Deleted ${chunksResult.deletedCount} chunks.`);

  // 3. Reset textContent and validation status in experts' references
  console.log("Resetting references in 'experts' collection...");
  const expertsCollection = db.collection("experts");
  
  // Use updateMany with arrayFilters to target all references inside all experts
  // We want to clear textContent, markdownPath, pdfUrl, and set isValidated to false.
  // We only need to update documents that have a 'references' array.
  
  const updateResult = await expertsCollection.updateMany(
    { "references": { $exists: true, $not: { $size: 0 } } },
    {
      $set: {
        "references.$[].textContent": undefined,
        "references.$[].markdownPath": null,
        "references.$[].isValidated": false,
      },
      // Optionally unset pdfUrl if we want them to re-fetch/re-upload, but let's keep the url they found
      // Actually, if we keep url, we just need to re-download. 
      // Let's unset textContent properly using $unset
      $unset: {
          "references.$[].textContent": ""
      }
    }
  );

  console.log(`Updated ${updateResult.modifiedCount} experts to reset their references.`);
  
  // Since we can't use $set and $unset on the same path, let's just use $set to null/undefined
  // Wait, I did use $set and $unset on the same path in the query above. That will throw an error.
  // Let me fix it.
}

async function run() {
    try {
        const { db } = await connectToDatabase();
        
        console.log("Starting Soft Reset of Knowledge Base...");
      
        // 1. Clear citations collection
        console.log("Clearing 'citations' collection...");
        const citationsResult = await db.collection("citations").deleteMany({});
        console.log(`Deleted ${citationsResult.deletedCount} citations.`);
      
        // 2. Clear chunks collection
        console.log("Clearing 'chunks' collection...");
        const chunksResult = await db.collection("chunks").deleteMany({});
        console.log(`Deleted ${chunksResult.deletedCount} chunks.`);
      
        // 3. Reset textContent and validation status in experts' references
        console.log("Resetting references in 'experts' collection...");
        const expertsCollection = db.collection("experts");
        
        const updateResult = await expertsCollection.updateMany(
          { "references": { $exists: true, $not: { $size: 0 } } },
          {
            $set: {
              "references.$[].markdownPath": null,
              "references.$[].isValidated": false,
            },
            $unset: {
                "references.$[].textContent": ""
            }
          }
        );
      
        console.log(`Updated ${updateResult.modifiedCount} experts to reset their references.`);
        
        console.log("Soft Reset Complete! Your experts and works are safe, but all extracted text/vectors are cleared.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
