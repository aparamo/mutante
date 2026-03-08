import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function main() {
  const models = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent("hello");
      console.log(`✅ ${m} WORKS`);
    } catch (e) {
      const error = e as Error & { statusText?: string };
      console.log(`❌ ${m} FAILED: ${error.statusText || error.message}`);
    }
  }
}
main();
