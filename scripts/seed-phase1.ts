import { connectToDatabase } from "../lib/db/mongodb";
import { ExpertSchema, type Expert } from "../lib/types";
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
  let currentExpert: Partial<Expert> | null = null;
  let lineIndex = 0;

  // Skip the header lines
  while (lineIndex < lines.length) {
    if (lines[lineIndex].startsWith("C O H O R T E")) {
      lineIndex++;
      break;
    }
    lineIndex++;
  }

  while (lineIndex < lines.length) {
    const line = lines[lineIndex];

    // Check if it's the start of a new expert (usually ALL CAPS or mostly caps for name)
    // Sometimes there are repeated headers "EL COLEGIO DE MÉXICO...", we skip those
    if (line.includes("EL COLEGIO DE MÉXICO") || line.includes("PROGRAMA DE ESTUDIOS") || line.includes("F E L L O W S") || line.startsWith("C O H O R T E")) {
      lineIndex++;
      continue;
    }

    // A new expert name usually doesn't have @ and is a short line
    if (!line.includes("@") && line.length < 100 && !line.includes("F I N A D A") && !line.includes("F I N A D O")) {
      // If we already had an expert, save it
      if (currentExpert && currentExpert.name) {
         try {
           const validExpert = ExpertSchema.parse({
             ...currentExpert,
             cohort: cohortNumber,
             references: [],
             topics: []
           });
           experts.push(validExpert);
         } catch (e) {
           console.error(`Error parsing expert ${currentExpert.name} in cohort ${cohortNumber}:`, e);
         }
      }

      // Start new expert
      currentExpert = {
        name: line,
      };
      
      lineIndex++;
      
      // Next line is usually the sector (spaced out like "A c a d e m i a" or "G o b i e r n o")
      if (lineIndex < lines.length) {
         const possibleSector = lines[lineIndex];
         if (possibleSector.includes(" ") || ["Academia", "Gobierno", "ONG", "Iniciativa Privada", "Organismo Internacional"].some(s => possibleSector.replace(/\s/g,'').toLowerCase() === s.toLowerCase())) {
           currentExpert.sector = possibleSector.replace(/\s/g, ''); // Clean spaces like "A c a d e m i a" -> "Academia"
           lineIndex++;
         }
      }

      // Next lines until an email are the title
      let titleParts = [];
      while (lineIndex < lines.length && !lines[lineIndex].includes("@") && !lines[lineIndex].includes("EL COLEGIO DE MÉXICO")) {
          // Skip FINADO
          if (lines[lineIndex].includes("F I N A D A") || lines[lineIndex].includes("F I N A D O")) {
              lineIndex++;
              continue;
          }
          titleParts.push(lines[lineIndex]);
          lineIndex++;
      }
      currentExpert.title = titleParts.join(" ");

      // Email line
      if (lineIndex < lines.length && lines[lineIndex].includes("@")) {
          currentExpert.email = lines[lineIndex].split(" ")[0]; // Sometimes there are spaces or extra chars
          lineIndex++;
      }

    } else if (line.includes("F I N A D A") || line.includes("F I N A D O")) {
        // Handle deceased case if it's the only info
        if (currentExpert) {
            currentExpert.title = "FINADO/A";
            try {
              const validExpert = ExpertSchema.parse({
                ...currentExpert,
                cohort: cohortNumber,
                references: [],
                topics: []
              });
              experts.push(validExpert);
            } catch (e) {
               console.error(`Error parsing expert ${currentExpert.name} in cohort ${cohortNumber}:`, e);
            }
            currentExpert = null;
        }
        lineIndex++;
    } else {
      lineIndex++;
    }
  }

  // Push the last one
  if (currentExpert && currentExpert.name) {
    try {
      const validExpert = ExpertSchema.parse({
        ...currentExpert,
        cohort: cohortNumber,
        references: [],
        topics: []
      });
      experts.push(validExpert);
    } catch (e) {
      console.error(`Error parsing expert ${currentExpert.name} in cohort ${cohortNumber}:`, e);
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
