import { z } from "zod";

const schema = z.object({
  email: z.string().email().optional().or(z.literal("")).catch("")
});

console.log(schema.safeParse({ email: "invalid-email" }));
console.log(schema.safeParse({ email: "valid@email.com" }));
console.log(schema.safeParse({ email: "" }));
