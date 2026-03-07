import { z } from "zod";

// References (links to videos, pdfs, articles)
export const ReferenceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  type: z.enum(["video", "article", "book", "social", "website", "other"]).optional().default("other"),
});

export type Reference = z.infer<typeof ReferenceSchema>;

// Detailed Social & Links
export const LinksSchema = z.object({
  linkedin: z.string().url().optional().or(z.literal("")),
  twitter: z.string().url().optional().or(z.literal("")),
  website: z.string().url().optional().or(z.literal("")),
  organization: z.string().url().optional().or(z.literal("")),
});

export type Links = z.infer<typeof LinksSchema>;

// The main Expert schema
export const ExpertSchema = z.object({
  id: z.string().optional(), // Can be the MongoDB ObjectId as string
  name: z.string().min(1, "Name is required"),
  cohort: z.number().int().positive(),
  sector: z.string().optional(),
  title: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),

  // -- Phase 2 Fields (Enriched) --
  isEnriched: z.boolean().optional().default(false), // Flag to track progress
  bio: z.string().optional(), // AI generated biography
  links: LinksSchema.optional(), // Social and Web links
  references: z.array(ReferenceSchema).optional().default([]), // Found links
  topics: z.array(z.string()).optional().default([]), // Key topics (e.g., "Desarrollo Rural", "Género")

  // -- Vector for AI --
  embedding: z.array(z.number()).optional(), // Mathematical vector for RAG
});

export type Expert = z.infer<typeof ExpertSchema>;

// -- Citations Schema --
// To store fundamental data, experiences, and deep lessons
export const CitationSchema = z.object({
  id: z.string().optional(), // MongoDB ObjectId
  expertId: z.string().optional(), // Link to the Expert
  expertName: z.string(), // Denormalized for easier querying
  quote: z.string(), // The exact quote or synthesized fundamental lesson
  sourceTitle: z.string().optional(), // Title of the book, article, video
  sourceUrl: z.string().url().optional().or(z.literal("")), // Link to the source
  date: z.string().optional(), // Approximate date of the quote/lesson
  context: z.string().optional(), // Brief context of the quote
  topics: z.array(z.string()).optional().default([]), // Topics related to the quote
  
  // -- Vector for AI --
  embedding: z.array(z.number()).optional(), // Semantic search vector
});

export type Citation = z.infer<typeof CitationSchema>;
