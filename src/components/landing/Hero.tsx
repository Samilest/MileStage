import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative bg-white pt-20 pb-32 lg:pt-32 lg:pb-48">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          
          {/* Left: Content */}
          <div className="max-w-xl">
            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-black leading-[1.1] tracking-tight mb-8">
              Clients can't push "just one more tweak" if the stage is closed.
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed mb-8">
              MileStage locks project stages, revision limits, and payments—so boundaries are clear and payment delays disappear.
            </p>

            {/* Key Features - Outcome-focused */}
            <div className="space-y-3 mb-10">
              {[
                'Stage locking prevents endless tweaks',
                'Revision counters make limits visible',
                'Payment gates stop unpaid work',
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg text-gray-700">{feature}</span>
                </div>
              ))}
            </div>

            <p className="text-lg text-black font-medium mb-8">
              The system enforces boundaries—not you.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <button
                onClick={() => navigate('/signup')}
                className="group bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg"
              >
                <span>Start Free</span>
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
              </button>
              <div className="text-sm text-gray-600">
                <div>14-day trial</div>
                <div>No credit card needed</div>
              </div>
            </div>
          </div>

          {/* Right: Dashboard Screenshot */}
          <div className="relative lg:ml-auto">
            <div className="relative rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white transition-transform duration-500 hover:scale-[1.02]">
              <img
                src="/dashboard-screenshot.png"
                alt="MileStage Dashboard - Track milestone payments"
                className="w-full h-auto"
              />
            </div>
            {/* Subtle accent */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-100 rounded-full -z-10 blur-3xl opacity-40 animate-pulse" />
          </div>

        </div>
      </div>
    </section>
  );
}
