import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ SECURITY WARNING: This key will be exposed in the browser!
// Make sure VITE_GEMINI_API_KEY is set in your frontend's .env file.
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const generateQuizWithGemini = async (text, numQuestions = 5, types = []) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
Generate ${numQuestions} quiz questions from the following study material:
---
${text}
---
Include ${types.length > 0 ? types.join(", ") : "various"} question types.
Format the response as JSON only, starting with [ and ending with ]:
[
  {
    "question": "string",
    "type": "Multiple Choice | Identification | True or False",
    "options": ["A", "B", "C", "D"], // only include for Multiple Choice
    "answer": "string" // The correct option string for MC, or the direct answer for others
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const output = response.text();

    // Attempt to extract JSON even if there's surrounding text
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch && jsonMatch[0]) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log("Parsed Gemini output:", parsed);
        return parsed;
    } else {
        console.error("Gemini returned non-JSON or invalid JSON:", output);
        throw new Error("Could not parse valid JSON from Gemini response.");
    }

  } catch (error) {
    console.error("Error calling Gemini API from frontend:", error);
    // Re-throw or handle as needed, maybe return an empty array or specific error object
    throw error; // Let the calling component handle the error display
  }
};
