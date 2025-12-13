import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-12 lg:py-16">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-black mb-3">
              MileStage
            </h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Track milestone payments and prevent scope creep. Get paid faster with clear project stages.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-base font-semibold text-black mb-4">
              Product
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#pricing"
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Pricing
                </a>
              </li>
              <li>
                <Link
                  to="/signup"
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Sign up
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Login
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-base font-semibold text-black mb-4">
              Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link
                  to="/terms"
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/refund-policy"
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200 gap-4">
          <p className="text-gray-500 text-sm">
            © 2025 MileStage. All rights reserved.
          </p>
          <a
            href="mailto:support@milestage.com"
            className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Contact Support
          </a>
        </div>
      </div>
    </footer>
  );
}
