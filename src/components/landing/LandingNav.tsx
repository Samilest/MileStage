import { useNavigate } from 'react-router-dom';
import logo from '../../assets/milestage-logo.png';

export default function LandingNav() {
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <img 
              src={logo}
              alt="MileStage" 
              className="h-8"
            />
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-700 hover:text-black transition-colors font-medium"
            >
              Pricing
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="text-gray-700 hover:text-black transition-colors font-medium"
            >
              FAQ
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            >
              Start Free
            </button>
          </nav>

          {/* Mobile CTA */}
          <button
            onClick={() => navigate('/signup')}
            className="md:hidden bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-all duration-200"
          >
            Start Free
          </button>
        </div>
      </div>
    </header>
  );
}
