import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative bg-white pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Content */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-6">
            Stop Scope Creep.
            <br />
            <span className="text-green-600">Get Paid Per Stage.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Clients can't push for "one more tweak" when the next stage is locked until payment clears.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5"
            >
              Try Free for 14 Days
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            No credit card required • Cancel anytime
          </p>
        </div>

        {/* Dashboard Screenshot */}
        <div className="relative max-w-5xl mx-auto">
          <div className="relative rounded-xl shadow-2xl border border-gray-200 overflow-hidden bg-gray-100">
            <img 
              src="/assets/screenshots/hero-dashboard.gif" 
              alt="MileStage Dashboard"
              className="w-full"
            />
          </div>
          
          {/* Floating badges - FIXED FOR MOBILE */}
          <div className="relative sm:absolute sm:-bottom-4 sm:bottom-8 sm:right-4 sm:-right-4 flex flex-col gap-3 mt-6 sm:mt-0 px-4 sm:px-0">
            <div className="bg-white rounded-lg shadow-xl px-4 py-3 border border-gray-100">
              <p className="text-sm font-semibold text-gray-900">Multi-currency</p>
              <p className="text-xs text-gray-500">USD, EUR, GBP & more</p>
            </div>

            <div className="bg-green-50 rounded-lg shadow-xl px-4 py-3 border border-green-200">
              <p className="text-sm font-bold text-green-800">$0 Transaction Fees</p>
              <p className="text-xs text-green-600">Keep 100% of payments</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
