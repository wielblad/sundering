import {
  Hero,
  HeroShowcase,
  Newsletter,
  Footer,
  SectionDivider,
  CinematicOverlay,
} from '../components/landing';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-game-dark relative">
      {/* Global cinematic overlay */}
      <CinematicOverlay noise={true} vignette={true} />

      {/* Hero Section */}
      <Hero />

      {/* Divider: Hero -> HeroShowcase */}
      <SectionDivider variant="ancient" />

      {/* Hero Showcase Section */}
      <HeroShowcase />

      {/* Divider: HeroShowcase -> Newsletter */}
      <SectionDivider variant="ancient" />

      {/* Newsletter Section */}
      <Newsletter />

      {/* Footer */}
      <Footer />
    </main>
  );
}
