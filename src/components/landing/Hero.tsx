import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative bg-white pt-20 pb-20 sm:pt-32 sm:pb-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Content */}
        <div className="text-center mb-12">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
            Stop Scope Creep.
            <br />
            Get Paid Per Stage.
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            Clients can't push for "one more tweak" when the next stage is locked until payment clears.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-10 py-5 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
            >
              Start Free Trial →
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            No credit card • 14 days free • Cancel anytime
          </p>
        </div>

        {/* MASSIVE Screenshot */}
        <div className="relative max-w-6xl mx-auto">
          <div className="relative rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
            <img 
              src="/assets/screenshots/hero-dashboard.png" 
              alt="MileStage Dashboard showing multiple projects with different currencies"
              className="w-full"
            />
          </div>
          
          {/* Floating badge - Multi-currency (MIDDLE LEFT) */}
          <div className="absolute top-1/2 -translate-y-1/2 -left-4 bg-white rounded-lg shadow-xl px-6 py-4 border border-gray-200 hidden lg:block">
            <p className="text-sm font-semibold text-gray-900">Multi-currency support</p>
            <p className="text-xs text-gray-600">USD, EUR, GBP, CAD & more</p>
          </div>

          {/* Floating badge - Zero fees (MIDDLE RIGHT) */}
          <div className="absolute top-1/2 -translate-y-1/2 -right-4 bg-green-50 rounded-lg shadow-xl px-6 py-4 border-2 border-green-600 hidden lg:block">
            <p className="text-sm font-bold text-green-900">$0 Transaction Fees</p>
            <p className="text-xs text-green-700">Keep 100% of payments</p>
          </div>
        </div>
      </div>
    </section>
  );
}
