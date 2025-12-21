import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative bg-white pt-20 pb-16 sm:pt-24 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
              Stop Scope Creep.
              <br />
              Get Paid Per Stage.
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
              Clients can't push for "one more tweak" when the next stage is locked until payment clears.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
              >
                Start Free Trial →
              </Link>
            </div>

            <p className="text-sm text-gray-500">
              No credit card • 14 days free • Cancel anytime
            </p>
          </div>

          {/* Right: Screenshot */}
          <div className="relative">
            <div className="relative rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <img 
                src="/assets/screenshots/hero-dashboard.png" 
                alt="MileStage Dashboard showing multiple projects with different currencies"
                className="w-full"
              />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg px-6 py-3 border border-gray-200">
              <p className="text-sm font-semibold text-gray-900">Multi-currency support</p>
              <p className="text-xs text-gray-600">USD, EUR, GBP, CAD & more</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
