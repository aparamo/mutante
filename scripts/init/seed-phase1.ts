import { connectToDatabase } from "../../lib/db/mongodb";
import { ExpertSchema, type Expert } from "../../lib/types";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { config } from "dotenv";

// Load environment variables from .env if running standalone
config();

const COHORTS_DIR = path.join(process.cwd(), "docs", "l", "cohorts");

/**
 * Parses a single structured markdown file from the cohorts directory.
 * @param filePath The path to the markdown file
 * @param cohortNumber The cohort number (extracted from filename)
 * @returns Array of parsed Expert objects
 */
async function parseCohortFile(filePath: string, cohortNumber: number): Promise<Expert[]> {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n").map(l => l.trim());
  
  const experts: Expert[] = [];
  
  let currentName = "";
  let currentSector = "";
  let currentTitle = "";
  let currentEmail = "";

  for (const line of lines) {
    if (line.startsWith("## ")) {
      // If we already have a name, push the previous expert
      if (currentName) {
        try {
          experts.push(ExpertSchema.parse({
            name: currentName,
            cohort: cohortNumber,
            sector: currentSector,
            title: currentTitle,
            email: currentEmail,
            references: [],
            topics: []
          }));
        } catch (e) {
          console.error(`Error parsing expert ${currentName} in cohort ${cohortNumber}:`, e);
        }
      }
      // Start new expert
      currentName = line.replace("## ", "").trim();
      currentSector = "";
      currentTitle = "";
      currentEmail = "";
    } else if (line.startsWith("**Sector:**")) {
      currentSector = line.replace("**Sector:**", "").trim();
    } else if (line.startsWith("**Cargo:**")) {
      currentTitle = line.replace("**Cargo:**", "").trim();
    } else if (line.startsWith("**Email:**")) {
      currentEmail = line.replace("**Email:**", "").trim();
    }
  }

  // Push the last expert
  if (currentName) {
    try {
      experts.push(ExpertSchema.parse({
        name: currentName,
        cohort: cohortNumber,
        sector: currentSector,
        title: currentTitle,
        email: currentEmail,
        references: [],
        topics: []
      }));
    } catch (e) {
      console.error(`Error parsing expert ${currentName} in cohort ${cohortNumber}:`, e);
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