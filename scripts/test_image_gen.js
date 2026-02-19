const { GoogleGenAI } = require("@google/genai");

async function testImageGen() {
  const apiKey = "AIzaSyCjNW4xJoQki6LbhkrG3LsOQPVR65Poaow";
  const genAI = new GoogleGenAI({ apiKey });
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image" });

  try {
    console.log("Attempting to generate image with gemini-2.5-flash-image...");
    // For image generation models in standard Gemini API, you often just send the prompt
    // But if it's an Imagen model wrapper, the SDK might have a specific helper.
    // Let's try standard generateContent first.
    const result = await model.generateContent(
      "A futuristic white reindeer glowing with neon lights, digital art style",
    );
    const response = await result.response;

    console.log("Response candidates:", response.candidates);
    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content.parts;
      console.log("Parts:", parts);
      for (const p of parts) {
        if (p.inlineData) {
          console.log(
            "Received inline data:",
            p.inlineData.mimeType,
            `${p.inlineData.data.substring(0, 50)}...`,
          );
        } else if (p.text) {
          console.log("Received text:", p.text);
        }
      }
    }
  } catch (e) {
    console.error("Error with generateContent:", e.message);

    // Attempt generic imagen method if widely supported by this SDK version
    try {
      console.log("Attempting SDK specific image method if available...");
      // Assuming maybe it's not exposed on this model object directly or standard call failed
    } catch (e2) {
      console.error(e2);
    }
  }
}

testImageGen();
