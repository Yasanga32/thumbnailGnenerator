import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string
});

async function listModels() {
  try {
    console.log("Testing connection with gemini-1.5-flash...");
    const response: any = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: ["Hello?"],
    });
    console.log("Connection successful. Response:", response.candidates[0].content.parts[0].text);
  } catch (error: any) {
    console.error("Error message:", error.message);
    console.error("Error details:", error);
  }
}

listModels();
