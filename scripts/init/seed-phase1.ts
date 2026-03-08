import { connectToDatabase } from "../../lib/db/mongodb";
import { ExpertSchema, type Expert } from "../../lib/types";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";

// Load environment variables from .env if running standalone
config();

const COHORTS_DIR = path.join(process.cwd(), "docs", "l", "cohorts");

/**
 * Parses a single markdown file from the cohorts directory.
 * @param filePath The path to the markdown file
 * @param cohortNumber The cohort number (extracted from filename)
 * @returns Array of parsed Expert objects
 */
async function parseCohortFile(filePath: string, cohortNumber: number): Promise<Expert[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  const experts: Expert[] = [];

  function isSectorLine(line: string) {
    if (!line) return false;
    const cleanLine = line.replace(/\s/g, '').toLowerCase();
    return cleanLine.includes("academia") ||
           cleanLine.includes("gobierno") ||
           cleanLine.includes("ong") ||
           cleanLine.includes("iniciativaprivada") ||
           cleanLine.includes("organismointernacional") ||
           cleanLine.includes("finada") ||
           cleanLine.includes("finado") ||
           cleanLine.includes("fellowslead-mexico");
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip headers
    if (line.includes("EL COLEGIO DE MÉXICO") || line.includes("PROGRAMA DE ESTUDIOS") || line.includes("F E L L O W S") || line.startsWith("C O H O R T E")) {
      i++;
      continue;
    }

    // Is it a name? (Next line is a sector)
    if (i + 1 < lines.length && isSectorLine(lines[i + 1])) {
      const name = line;
      const sectorLine = lines[i + 1];
      let sector = sectorLine.replace(/\s/g, '');
      const titleParts = [];
      let email = "";
      
      let j = i + 2;
      while (j < lines.length) {
        // Stop if we hit the next name
        if (j + 1 < lines.length && isSectorLine(lines[j + 1])) {
          break; // Next expert
        }
        
        // Skip headers inside the block
        if (lines[j].includes("EL COLEGIO DE MÉXICO") || lines[j].includes("PROGRAMA DE ESTUDIOS") || lines[j].includes("F E L L O W S") || lines[j].startsWith("C O H O R T E")) {
          j++;
          continue;
        }

        if (lines[j].includes("@")) {
          email = lines[j].split(" ")[0]; // Take first part just in case there's spaces
          // Email usually ends the block, but there could be edge cases. 
          // We break to be safe and start looking for the next expert.
          j++;
          break; 
        } else {
          titleParts.push(lines[j]);
        }
        j++;
      }

      // Check if it's FINADO in the sector line
      let title = titleParts.join(" ");
      if (sector.toLowerCase().includes("finada") || sector.toLowerCase().includes("finado")) {
         title = "FINADO/A";
         sector = "N/A";
      }

      try {
        const validExpert = ExpertSchema.parse({
          name: name,
          cohort: cohortNumber,
          sector: sector,
          title: title,
          email: email || "",
          references: [],
          topics: []
        });
        experts.push(validExpert);
      } catch (e) {
        console.error(`Error parsing expert ${name} in cohort ${cohortNumber}:`, e);
      }

      i = j; // Move to the line after this expert
    } else {
      i++;
    }
  }

  return experts;
}

async function main() {
  console.log("Starting Phase 1: Markdown Parsing and Database Seeding");

  const { db } = await connectToDatabase();
  const expertsCollection = db.collection<Expert>("experts");

  try {
    const files = await readdir(COHORTS_DIR);
    const mdFiles = files.filter(f => f.endsWith(".md")).sort((a, b) => {
        const numA = parseInt(a.replace(".md", ""));
        const numB = parseInt(b.replace(".md", ""));
        return numA - numB;
    });

    let totalImported = 0;

    for (const file of mdFiles) {
      const cohortNum = parseInt(file.replace(".md", ""));
      console.log(`Processing Cohort ${cohortNum} from file ${file}...`);
      
      const filePath = path.join(COHORTS_DIR, file);
      const expertsInCohort = await parseCohortFile(filePath, cohortNum);

      console.log(`Found ${expertsInCohort.length} experts in Cohort ${cohortNum}.`);

      for (const expert of expertsInCohort) {
        // Upsert into database based on name and cohort
        await expertsCollection.updateOne(
          { name: expert.name, cohort: expert.cohort },
          { $set: expert },
          { upsert: true }
        );
      }
      
      totalImported += expertsInCohort.length;
    }

    console.log(`\nPhase 1 Complete! Successfully processed and seeded ${totalImported} experts into the database.`);

    // Create indexes for faster querying
    await expertsCollection.createIndex({ name: 1 });
    await expertsCollection.createIndex({ cohort: 1 });
    
    // Create a vector search index later when Phase 2 is done.
    
    process.exit(0);
  } catch (error) {
    console.error("An error occurred during Phase 1:", error);
    process.exit(1);
  }
}

main();
