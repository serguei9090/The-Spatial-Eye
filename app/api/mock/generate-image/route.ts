import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // List of curated high-quality placeholder images for the demo
    const MOCK_IMAGES = [
      "https://images.unsplash.com/photo-1699047910901-b7553b957599?q=80&w=1932&auto=format&fit=crop", // Abstract Digital Art
      "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1975&auto=format&fit=crop", // Futuristic City
      "https://images.unsplash.com/photo-1636955860106-9eb7a72cbd95?q=80&w=2070&auto=format&fit=crop", // Cyberpunk Street
      "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=2008&auto=format&fit=crop", // Neon Particles
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1964&auto=format&fit=crop", // Abstract Fluid
    ];

    // Pick a random image to vary the experience
    const randomImage = MOCK_IMAGES[Math.floor(Math.random() * MOCK_IMAGES.length)];

    return NextResponse.json({
      url: randomImage,
      prompt: prompt,
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate mock image" }, { status: 500 });
  }
}
