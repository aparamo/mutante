import { config } from "dotenv";
config();
const apiKey = process.env.GEMINI_API_KEY;

interface Model {
  name: string;
}

async function main() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json() as { models: Model[] };
  console.log(JSON.stringify(data.models.map((m: Model) => m.name), null, 2));
}
main();