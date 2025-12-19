import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 py-16">
      <div className="max-w-7xl mx-auto px-6 lg:px-20">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-4">MileStage</h3>
            <p className="text-gray-600">
              Stage-by-stage payment tracking for freelancers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-lg font-semibold text-black mb-4">Product</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#how-it-works"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  How it works
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold text-black mb-4">Company</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  to="/refund"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-black mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:support@milestage.com"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  support@milestage.com
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="text-gray-600 hover:text-black transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-center text-gray-600">
            © 2025 MileStage. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
