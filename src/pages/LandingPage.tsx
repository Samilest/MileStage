import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNav from '../components/landing/LandingNav';
import Hero from '../components/landing/Hero';
import Comparison from '../components/landing/Comparison';
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
  const location = useLocation();

  // Auto-scroll to section when hash is present
  useEffect(() => {
    if (location.hash) {
      // Remove the # from hash
      const id = location.hash.replace('#', '');
      
      // Wait for page to render, then scroll
      setTimeout(() => {
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  }, [location]);

  return (
    <div className="bg-white">
      <LandingNav />
      <Hero />
      <Comparison />
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
