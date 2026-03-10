import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
  const modelName = "gemini-embedding-001";
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text: "Hello world" }] },
      outputDimensionality: 768
    } as any);
    console.log(`Success! returned ${result.embedding.values.length} dimensions`);
  } catch (e) {
    console.log(`Failed ${modelName}:`, (e as any).message);
  }
}

main().catch(console.error);
