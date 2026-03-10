import { embed } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const { embedding } = await embed({
      model: google.textEmbeddingModel("gemini-embedding-001"),
      value: "hello world"
    });
    console.log("ai-sdk success! Dimensions:", embedding.length);
  } catch (e) {
    console.error("ai-sdk failed:", e);
  }
}

main();
