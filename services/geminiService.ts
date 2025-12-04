import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY || '';

export const generateAIPassphrase = async (theme: string = 'Space'): Promise<string> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Cannot generate AI passphrase.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const prompt = `Generate a single, memorable, high-entropy passphrase consisting of 4 to 6 random but coherent words related to the theme: "${theme}". 
    Separate words with hyphens or spaces. 
    Mix capitalization slightly for security but keep it readable. 
    Examples: "Nebula-Drifting-Silent-Void", "Quantum-Leap-Red-Star". 
    Do not add any preamble or markdown. Just the string.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 1.2, // High creativity for randomness
        maxOutputTokens: 50,
      }
    });

    return response.text.trim();
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
