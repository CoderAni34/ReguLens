import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenAI({
  apiKey,
});

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function testGemini() {
  const maxRetries = 3;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents:
          "Say hello from Gemini AI and confirm that the ReguLens connection is working.",
      });

      return response.text;
    } catch (error) {
      console.error(
        `Gemini attempt ${attempt + 1} failed:`,
        error
      );

      const isLastAttempt = attempt === maxRetries - 1;

      if (isLastAttempt) {
        throw error;
      }

      // Wait: 1 sec → 2 sec → 4 sec
      const delay = 1000 * Math.pow(2, attempt);

      await sleep(delay);
    }
  }
}