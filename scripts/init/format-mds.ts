import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const COHORTS_DIR = path.join(process.cwd(), "docs", "l", "cohorts");

function isSectorLine(line: string) {
  if (!line) return false;
  let normalized = line.toLowerCase();
  normalized = normalized.replace(/\(.*?\)/g, ''); // remove parens and content
  normalized = normalized.replace(/[\s\.]/g, ''); // remove all spaces and dots (for O.N.G)
  
  const validSectors = [
    "academia", "gobierno", "ong", "iniciativaprivada", "organismointernacional", 
    "finada", "finado", "onginternacional", "sectorpopular"
  ];

  const parts = normalized.split(/[\/\,\-]/);
  
  return parts.length > 0 && parts.every(part => part === "" || validSectors.includes(part));
}

function formatSector(line: string) {
  let normalized = line.toLowerCase();
  normalized = normalized.replace(/\(.*?\)/g, '');
  normalized = normalized.replace(/[\s\.]/g, '');
  
  if (normalized.includes("finada") || normalized.includes("finado")) return "Finado";
  
  const parts = normalized.split(/[\/\,\-]/).filter(p => p !== "");
  const formattedParts: string[] = [];
  
  for (const part of parts) {
    if (part === "academia") formattedParts.push("Academia");
    else if (part === "gobierno") formattedParts.push("Gobierno");
    else if (part === "ong" || part === "onginternacional") formattedParts.push("ONG");
    else if (part === "iniciativaprivada") formattedParts.push("Iniciativa Privada");
    else if (part === "organismointernacional") formattedParts.push("Organismo Internacional");
    else if (part === "sectorpopular") formattedParts.push("Sector Popular");
  }
  
  return Array.from(new Set(formattedParts)).join(" / ");
}

async function formatCohortFile(filePath: string, cohortNumber: number) {
  const content = await readFile(filePath, "utf-8");
  const lines = content.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  
  const experts: { name: string, sector: string, title: string, email: string }[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Skip headers and pagination
    if (line.includes("EL COLEGIO DE MÉXICO") || line.includes("PROGRAMA DE ESTUDIOS") || line.includes("F E L L O W S") || line.startsWith("C O H O R T E") || line.match(/^\d+$/)) {
      i++;
      continue;
    }

    // Is it a name? (Next line is a sector)
    if (i + 1 < lines.length && isSectorLine(lines[i + 1])) {
      const name = line;
      const sectorLine = lines[i + 1];
      let sector = formatSector(sectorLine);
      const titleParts = [];
      let email = "";
      
      let j = i + 2;
      while (j < lines.length) {
        if (j + 1 < lines.length && isSectorLine(lines[j + 1])) {
          break; // Next expert
        }
        
        // Skip headers inside the block
        if (lines[j].includes("EL COLEGIO DE MÉXICO") || lines[j].includes("PROGRAMA DE ESTUDIOS") || lines[j].includes("F E L L O W S") || lines[j].startsWith("C O H O R T E") || lines[j].match(/^\d+$/)) {
          j++;
          continue;
        }

        if (lines[j].includes("@")) {
          // Sometimes multiple emails are space-separated or in the same line
          email = lines[j]; 
          j++;
          break; 
        } else {
          titleParts.push(lines[j]);
        }
        j++;
      }

      let title = titleParts.join(" ");
      if (sector === "Finado") {
         title = "FINADO/A";
      }

      experts.push({ name, sector, title, email });
      i = j; 
    } else {
      i++;
    }
  }

  // Generate new markdown content
  let newMarkdown = `# Cohorte ${cohortNumber}\n\n`;
  for (const expert of experts) {
    newMarkdown += `## ${expert.name}\n`;
    newMarkdown += `**Sector:** ${expert.sector}\n`;
    newMarkdown += `**Cargo:** ${expert.title}\n`;
    newMarkdown += `**Email:** ${expert.email}\n\n`;
  }

  await writeFile(filePath, newMarkdown.trim() + "\n", "utf-8");
  return experts.length;
}

async function main() {
  console.log("Starting Markdown Formatting...");

  try {
    const files = await readdir(COHORTS_DIR);
    const mdFiles = files.filter(f => f.endsWith(".md")).sort((a, b) => {
        const numA = parseInt(a.replace(".md", ""));
        const numB = parseInt(b.replace(".md", ""));
        return numA - numB;
    });

    let totalProcessed = 0;

    for (const file of mdFiles) {
      const cohortNum = parseInt(file.replace(".md", ""));
      const filePath = path.join(COHORTS_DIR, file);
      const count = await formatCohortFile(filePath, cohortNum);
      console.log(`Processed Cohort ${cohortNum}: ${count} experts formatted.`);
      totalProcessed += count;
    }

    console.log(`\nFormatting Complete! Successfully cleaned and structured ${totalProcessed} experts across ${mdFiles.length} files.`);
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

main();