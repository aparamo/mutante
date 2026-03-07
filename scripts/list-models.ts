import { config } from "dotenv";
config();
const apiKey = process.env.GEMINI_API_KEY;

async function main() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  console.log(JSON.stringify(data.models.map((m: any) => m.name), null, 2));
}
main();