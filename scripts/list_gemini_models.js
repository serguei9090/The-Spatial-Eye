require("dotenv").config({ path: ".env.local" });
const { GoogleGenAI } = require("@google/genai");

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No API key provided");
    return;
  }

  // Use REST API directly to list models
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.models) {
      console.log("Available Models:");
      for (const model of data.models) {
        if (
          model.name.includes("flash") ||
          model.name.includes("image") ||
          model.name.includes("banana")
        ) {
          console.log(`- ${model.name} (${model.displayName})`);
          console.log(
            `  Supported Generation Methods: ${model.supportedGenerationMethods.join(",")}`,
          );
        }
      }
    } else {
      console.log("No models found or error structure:", data);
    }
  } catch (e) {
    console.error(e);
  }
}

await listModels();
