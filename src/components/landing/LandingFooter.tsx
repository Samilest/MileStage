import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function LandingFooter() {
  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === '/';

  // Handle scroll to section
  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    
    if (isHomePage) {
      // Already on homepage - just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      // On different page - navigate to homepage with hash
      window.location.href = `/#${sectionId}`;
    }
  };

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <img 
              src="assets/Footer_Logo.png" 
              alt="MileStage" 
              className="h-8 mb-4"
            />
            <p className="text-gray-600 text-sm">
              Stage-by-stage payment tracking for freelancers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Product</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="#pricing"
                  onClick={(e) => handleSectionClick(e, 'pricing')}
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Company</h3>
            <ul className="space-y-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:support@milestage.com"
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  support@milestage.com
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  onClick={(e) => handleSectionClick(e, 'faq')}
                  className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600 text-sm">
            © {new Date().getFullYear()} MileStage. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
