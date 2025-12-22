import { Link } from 'react-router-dom';

export default function LandingNav() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Try multiple paths, fallback to text */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/assets/milestage-logo.png" 
              alt="MileStage Logo" 
              className="h-8"
              onError={(e) => {
                // Try alternative path
                const img = e.currentTarget as HTMLImageElement;
                if (img.src.includes('/assets/milestage-logo.png')) {
                  img.src = '/src/assets/milestage-logo.png';
                } else if (img.src.includes('/src/assets/')) {
                  // If that fails too, show fallback
                  img.style.display = 'none';
                  const fallback = img.nextElementSibling as HTMLElement;
                  if (fallback) fallback.classList.remove('hidden');
                }
              }}
            />
            {/* Fallback: Green M + MileStage text */}
            <div className="hidden items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
              </div>
              <span className="text-xl font-bold text-gray-900">MileStage</span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#pricing"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </a>
            <a
              href="#faq"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              FAQ
            </a>
            <Link
              to="/login"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Link
              to="/signup"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              Start Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
