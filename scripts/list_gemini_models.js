const { GoogleGenAI } = require("@google/genai");

async function listModels() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("No API key provided");
    return;
  }

  const client = new GoogleGenAI({ apiKey });

  try {
    // The SDK might not have a direct listModels method exposed easily in the main class in all versions
    // But typically it's under `models`
    // Let's try the v1beta way if the SDK allows, or just use fetch
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    const data = await response.json();

    if (data.models) {
      console.log("Available Models:");
      for (const m of data.models) {
        if (m.name.includes("flash") || m.name.includes("image") || m.name.includes("banana")) {
          console.log(`- ${m.name} (${m.displayName})`);
          console.log(`  Supported Generation Methods: ${m.supportedGenerationMethods}`);
        }
      }
    } else {
      console.log("No models found or error structure:", data);
    }
  } catch (e) {
    console.error(e);
  }
}

listModels();
