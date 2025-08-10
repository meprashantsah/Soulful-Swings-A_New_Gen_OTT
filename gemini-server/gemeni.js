require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize the Generative AI client with the API key
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Function to extract keywords for multiple question-answer pairs
async function extractKeywordsBatch(responses) {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a single prompt for batch processing
    const prompt = responses
      .map(
        ({ question, answer }, index) =>
          `Q${index + 1}: ${question}\nA${index + 1}: ${answer}\n`
      )
      .join("") +
      `\nExtract relevant keywords for each answer, mapping them to their corresponding question numbers. Format:\nQ1: [keywords]\nQ2: [keywords]`;

    // Generate content using the model
    const result = await model.generateContent(prompt);
      
    // Safely access the response content
    const responseParts = result.response?.candidates?.[0]?.content?.parts;

    if (!Array.isArray(responseParts) || responseParts.length === 0) {
      throw new Error("Invalid response format; expected an array of parts.");
    }

    const responseText = responseParts[0]?.text; // Extract text from the first part

    if (typeof responseText !== "string") {
      throw new Error("Invalid responseText format; expected a string.");
    }

    // Parse the response into question-keyword mapping
    const keywordMapping = responses.map((response, index) => {
      const questionNumber = `Q${index + 1}:`;
      const regex = new RegExp(`${questionNumber}\\s*(.*?)\\n`); // Match QX: keywords
      const match = responseText.match(regex);

      return {
        question: response.question,
        keywords: match ? match[1].split(",").map((k) => k.trim()) : [],
      };
    });

    return keywordMapping;
  } catch (error) {
    console.error("Error extracting keywords:", error.message);
    return [];
  }
}

// Export the function for usage in API routes
module.exports = { extractKeywordsBatch };

