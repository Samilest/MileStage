import { Link } from 'react-router-dom';

export default function FinalCTA() {
  return (
    <section className="py-20 bg-gray-900 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: CTA Content */}
          <div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Stop Chasing Payments
            </h2>
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Let the system do the work. Automated reminders. Locked stages. Professional client portal.
            </p>
            <p className="text-lg text-gray-400 mb-10">
              Join freelancers who've eliminated scope creep and payment stress.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center px-10 py-5 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/50"
              >
                Start Free Trial →
              </Link>
            </div>

            <div className="flex items-start gap-3 text-gray-400 text-sm">
              <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <p>14 days free • No credit card • Cancel anytime</p>
            </div>
          </div>

          {/* Right: Human Photo */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
              <img 
                src="/assets/photos/freelancer-relaxed.jpg" 
                alt="Freelancer working without payment stress"
                className="w-full aspect-square object-cover"
              />
            </div>

            {/* Floating testimonial card (when you have real testimonials) */}
            {/* 
            <div className="absolute -bottom-6 -left-6 bg-white rounded-xl p-6 shadow-2xl max-w-sm">
              <p className="text-gray-700 mb-3 italic">
                "I used to spend hours chasing payments. Now it's automatic. Game changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full"></div>
                <div>
                  <p className="font-semibold text-gray-900">Sarah Chen</p>
                  <p className="text-sm text-gray-600">Brand Designer</p>
                </div>
              </div>
            </div>
            */}
          </div>
        </div>
      </div>
    </section>
  );
}
