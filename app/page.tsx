import { LandingTemplate } from "@/components/templates/LandingTemplate";

export default function Home() {
  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden dark">
      <HomeContent />
    </div>
  );
}

function HomeContent() {
  return <LandingTemplate />;
}
