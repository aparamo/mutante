import { connectToDatabase } from "../db/mongodb";
import type { Expert, Citation } from "../types";
import { ObjectId, Filter } from "mongodb";

export async function getExperts(
  query: string = "",
  cohort?: number,
  sector?: string,
  enrichedOnly: boolean = false
): Promise<Expert[]> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Expert>("experts");

  const filter: Filter<Expert> = {};
  
  if (query) {
    // Si hay query, buscamos en múltiples campos
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { title: { $regex: query, $options: "i" } },
      { sector: { $regex: query, $options: "i" } },
      { topics: { $regex: query, $options: "i" } },
      { bio: { $regex: query, $options: "i" } },
      { "links.organizationName": { $regex: query, $options: "i" } }
    ];
  }
  
  if (cohort) {
    filter.cohort = cohort;
  }
  
  if (sector && sector !== "all") {
    filter.sector = sector;
  }

  if (enrichedOnly) {
    filter.isEnriched = true;
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
