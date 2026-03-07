import { connectToDatabase } from "../db/mongodb";
import type { Expert, Citation } from "../types";
import { ObjectId } from "mongodb";

export async function getExperts(
  query: string = "",
  cohort?: number,
  sector?: string,
  enrichedOnly: boolean = false
): Promise<Expert[]> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Expert>("experts");

  const filter: any = {};
  
  if (query) {
    // Si hay query, buscamos en múltiples campos
    filter.$or = [
      { name: { $regex: query, $options: "i" } },
      { title: { $regex: query, $options: "i" } },
      { sector: { $regex: query, $options: "i" } },
      { topics: { $regex: query, $options: "i" } },
      { bio: { $regex: query, $options: "i" } },
      { "links.organization": { $regex: query, $options: "i" } }
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

  return experts.map(e => ({
    ...e,
    id: e._id?.toString(),
    _id: undefined,
  }));
}

export async function getExpertById(id: string): Promise<Expert | null> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Expert>("experts");

  let expert = null;
  try {
     expert = await collection.findOne({ _id: new ObjectId(id) });
  } catch (e) {
     return null;
  }

  if (!expert) return null;

  return {
    ...expert,
    id: expert._id?.toString(),
    _id: undefined,
  };
}

export async function getCitationsByExpertId(expertId: string): Promise<Citation[]> {
  const { db } = await connectToDatabase();
  const collection = db.collection<Citation>("citations");

  const citations = await collection.find({ expertId }).toArray();

  return citations.map(c => ({
    ...c,
    id: c._id?.toString(),
    _id: undefined,
  }));
}

export async function getCohortsAndSectors() {
  const { db } = await connectToDatabase();
  const collection = db.collection<Expert>("experts");

  const cohorts = await collection.distinct("cohort");
  const sectors = await collection.distinct("sector");

  return {
    cohorts: cohorts.filter(c => c != null).sort((a, b) => a - b),
    sectors: sectors.filter(s => s != null).sort(),
  };
}
