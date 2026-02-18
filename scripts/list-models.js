const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

if (!API_KEY) {
    console.error("API Key missing");
    process.exit(1);
}

async function listModels() {
    console.log("Listing models...");
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        console.error("Failed:", await resp.text());
        return;
    }
    const data = await resp.json();
    console.log("Models found:", data.models?.length);
    data.models?.forEach(m => {
        if (m.name.includes("gemini")) {
            console.log(`- ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
        }
    });
}

listModels();
