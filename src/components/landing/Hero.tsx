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
              Stop Scope Creep.
              <br />
              Get Paid Faster.
            </h1>
            
            <div className="space-y-3 text-xl lg:text-2xl text-gray-700 leading-relaxed mb-12">
              <p>Stage-by-stage payment tracking with automatic locking.</p>
              <p>Client can't start next stage until current stage is paid.</p>
              <p className="text-black font-medium">No free work. No awkward conversations.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <button
                onClick={() => navigate('/signup')}
                className="group bg-green-600 hover:bg-green-700 text-white font-semibold px-10 py-4 rounded-xl text-lg transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <span>Start Free</span>
                <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <div className="text-sm text-gray-600">
                <div>14-day trial</div>
                <div>No credit card needed</div>
              </div>
            </div>
          </div>

          {/* Right: Dashboard Screenshot */}
          <div className="relative lg:ml-auto">
            <div className="relative rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
              <img
                src="/dashboard-screenshot.png"
                alt="MileStage Dashboard - Track milestone payments"
                className="w-full h-auto"
              />
            </div>
            {/* Subtle accent */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-green-100 rounded-full -z-10 blur-3xl opacity-30" />
          </div>

        </div>
      </div>
    </section>
  );
}
