import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import Features from '../components/landing/Features';
import HowItWorks from '../components/landing/HowItWorks';
import ScopeCreepPrevention from '../components/landing/ScopeCreepPrevention';
import ClientApprovals from '../components/landing/ClientApprovals';
import TrustSection from '../components/landing/TrustSection';
import Pricing from '../components/landing/Pricing';
import FAQ from '../components/landing/FAQ';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <div className="bg-white">
      <LandingNav />
      <Hero />
      <Features />
      <HowItWorks />
      <ScopeCreepPrevention />
      <ClientApprovals />
      <TrustSection />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </div>
  );
}
