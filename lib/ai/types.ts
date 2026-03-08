import { z } from "zod";

export const EnrichedDataSchema = z.object({
  bio: z.string().optional(),
  topics: z.array(z.string()).optional(),
  links: z.object({
    linkedin: z.string().url().or(z.literal("")).optional(),
    twitter: z.string().url().or(z.literal("")).optional(),
    website: z.string().url().or(z.literal("")).optional(),
    organization: z.string().url().or(z.literal("")).optional(),
  }).optional(),
  references: z.array(z.object({
    title: z.string(),
    url: z.string().url().or(z.literal("")),
    type: z.enum(["video", "article", "book", "social", "website", "other"]),
    description: z.string().optional(),
  })).optional(),
  citations: z.array(z.object({
      quote: z.string(),
      sourceTitle: z.string(),
      sourceUrl: z.string().url().or(z.literal("")),
      date: z.string().optional(),
      context: z.string().optional(),
      topics: z.array(z.string()).optional(),
  })).optional(),
});

export type EnrichedData = z.infer<typeof EnrichedDataSchema>;
