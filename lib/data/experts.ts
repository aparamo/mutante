import { connectToDatabase } from "../db/mongodb";
import type { Expert, Citation } from "../types";
import { ObjectId, Filter } from "mongodb";

export async function getExperts(
  query: string = "",
  cohort?: number,
  sectors?: string[],
  enrichedOnly: boolean = false
): Promise<Expert[]> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Expert>("experts");

  const filter: Filter<Expert> = {};
  const andConditions: Filter<Expert>[] = [];
  
  if (query) {
    // Si hay query, buscamos en múltiples campos
    andConditions.push({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { title: { $regex: query, $options: "i" } },
        { sector: { $regex: query, $options: "i" } },
        { topics: { $regex: query, $options: "i" } },
        { bio: { $regex: query, $options: "i" } },
        { "links.organizationName": { $regex: query, $options: "i" } }
      ]
    });
  }
  
  if (cohort) {
    andConditions.push({ cohort });
  }
  
  if (sectors && sectors.length > 0) {
    // Map master sectors to regex patterns to catch variations like "Academia/ONG", "IniciativaPrivada", etc.
    const sectorRegexMap: Record<string, string> = {
      "Academia": "\\bacademia\\b",
      "ONG": "\\bong\\b|\\bonginternacional\\b",
      "Gobierno": "\\bgobierno\\b",
      "Iniciativa Privada": "\\biniciativaprivada\\b|\\biniciativa privada\\b",
      "Organismo Internacional": "\\borganismointernacional\\b|\\borganismo internacional\\b",
      "Sector Popular": "\\bsectorpopular\\b|\\bsector popular\\b",
      "Finado": "\\bfinad[oa]\\b"
    };

    const sectorOrConditions = sectors.map(sector => {
      const pattern = sectorRegexMap[sector] || sector;
      return { sector: { $regex: pattern, $options: "i" } };
    });

    andConditions.push({ $or: sectorOrConditions });
  }

  if (enrichedOnly) {
    andConditions.push({ isEnriched: true });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const experts = await collection
    .find(filter)
    .sort({ isEnriched: -1, cohort: 1, name: 1 }) // Priorizamos mostrar a los enriquecidos primero
    .toArray();

  return experts.map(doc => {
    const { _id, ...rest } = doc;
    return { ...rest, id: _id?.toString() };
  });
}

export async function getExpertById(id: string): Promise<Expert | null> {
  const { db } = await connectToDatabase();
  const collection = db.collection("experts");

  let expertDoc = null;
  try {
     expertDoc = await collection.findOne({ _id: new ObjectId(id) }) as unknown as Expert | null;
  } catch (error: unknown) {
     console.error("Error fetching expert by ID:", error);
     return null;
  }

  if (!expertDoc) return null;

  const { _id, ...rest } = expertDoc;
  return { ...rest, id: _id?.toString() };
}

export async function getCitationsByExpertId(expertId: string): Promise<Citation[]> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Citation>("citations");

  // In the Citation schema, the expertId is already a string, so no ObjectId conversion is needed here.
  const citations = await collection.find({ expertId }).toArray();

  return citations.map(doc => {
    const { _id, ...rest } = doc;
    return { ...rest, id: _id?.toString() };
  });
}

export async function getCohortsAndSectors() {
  const { db } = await connectToDatabase();
  const collection = db.collection<Expert>("experts");

  const cohorts = await collection.distinct("cohort");
  const sectors = await collection.distinct("sector") as string[];

  return {
    cohorts: cohorts.filter(c => c != null).sort((a, b) => a - b),
    sectors: sectors.filter(s => s != null).sort(),
  };
}
