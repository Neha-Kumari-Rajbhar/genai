import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config()

const ai = new GoogleGenAI({apiKey:process.env.GEMINIKEY});

async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: "what is array",
    config: {
      systemInstruction: `You are a data structure algorithm(dsa) instructor. Explain every 
      dsa concepts related to the question in easy way also give the code if required.
      Do not answer any thing except dsa if user asked except dsa
      then 
      your reply : i can't help, can you please asked my question related to dsa`,
    },
  });
  console.log(response.text);
}

await main();