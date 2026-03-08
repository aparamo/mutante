import { z } from "zod";

const schema = z.object({
  year: z.number().int().nullish()
});

console.log(schema.safeParse({ year: NaN }));