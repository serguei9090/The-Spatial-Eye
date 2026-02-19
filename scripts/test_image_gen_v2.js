const { GoogleGenAI } = require("@google/genai");

async function testImageGen() {
  const apiKey = "AIzaSyCjNW4xJoQki6LbhkrG3LsOQPVR65Poaow";
  const client = new GoogleGenAI({ apiKey });

  try {
    console.log("Attempting generation with gemini-2.5-flash-image...");
    // Using client.models.generateContent from the new SDK structure
    const response = await client.models.generateContent({
      model: "models/gemini-2.5-flash-image", // Full resource name from listing
      contents: [
        {
          role: "user",
          parts: [{ text: "Generate a photorealistic image of a futuristic neon city." }],
        },
      ],
    });

    console.log("Response:", JSON.stringify(response, null, 2));

    if (response.candidates && response.candidates.length > 0) {
      const content = response.candidates[0].content;
      if (content?.parts) {
        content.parts.forEach((part, i) => {
          console.log(`Part ${i}:`, part);
          if (part.inlineData) {
            console.log("INLINE IMAGE DATA FOUND!");
          }
        });
      }
    }
  } catch (e) {
    console.error("Error:", e);
  }
}

testImageGen();
