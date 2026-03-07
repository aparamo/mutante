import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";
config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
async function main() {
  const models = ['text-embedding-004', 'embedding-001', 'models/text-embedding-004'];
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.embedContent("hello");
      console.log(`✅ ${m} WORKS`);
    } catch (e: any) {
      console.log(`❌ ${m} FAILED: ${e.statusText || e.message}`);
    }
  }
}
main();
