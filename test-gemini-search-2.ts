import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from "dotenv";

config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const searchModel = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  tools: [
    {
      google_search: {}, 
    },
  ],
});

async function main() {
  try {
    const result = await searchModel.generateContent("Who won the super bowl in 2024?");
    console.log("Success with google_search!");
  } catch (e) {
    console.error(e);
  }
}

main();