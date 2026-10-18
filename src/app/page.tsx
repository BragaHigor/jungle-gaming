import { About } from "@/features/profile/components/about";
import { GameInvitation } from "@/features/profile/components/game-invitation";
import { Hero } from "@/features/profile/components/hero";
import { ProjectDecisions } from "@/features/profile/components/project-decisions";
import "@/features/profile/profile.css";

export default function HomePage() {
  return (
    <main id="main-content" tabIndex={-1}>
      <Hero />
      <About />
      <GameInvitation />
      <ProjectDecisions />
    </main>
  );
}
