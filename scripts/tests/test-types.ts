import { GoogleGenerativeAI, Tool } from "@google/generative-ai";

const tools: Tool[] = [
  {
    google_search: {}, 
  } as unknown as Tool,
];
