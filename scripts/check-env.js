const dotenv = require("dotenv");
dotenv.config({ path: ".env.local" });

console.log("Checking Environment Variables...");

const key = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

if (!key) {
  console.error("❌ FIREBASE_ADMIN_PRIVATE_KEY is missing!");
  process.exit(1);
}

console.log("✅ FIREBASE_ADMIN_PRIVATE_KEY found.");
console.log(`Hash length: ${key.length}`);
console.log(`First 30 chars: ${key.substring(0, 30)}...`);

if (key.includes("\\n")) {
  console.log(
    "⚠️  Key contains literal \\n characters (escaped newlines). This is expected for .env files.",
  );
  const realKey = key.replace(/\\n/g, "\n");
  if (realKey.includes("-----BEGIN PRIVATE KEY-----")) {
    console.log("✅ Key parses correctly into PEM format.");
  } else {
    console.error("❌ Key does not look like a PEM private key after unescaping.");
  }
} else if (key.includes("\n")) {
  console.log("ℹ️  Key contains actual newline characters.");
} else {
  console.error("❌ Key has no newlines and no escaped newlines. It might be corrupted.");
}

if (!process.env.GOOGLE_API_KEY && !process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
  console.error("❌ GOOGLE_API_KEY is missing!");
} else {
  console.log("✅ GOOGLE_API_KEY found.");
}
