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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
          Your Work Deserves to Be Paid.
          <br />
          <span className="text-green-400">On Time. Every Time.</span>
        </h2>
        
        <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
          Stop doing free work. Stop chasing payments. Let MileStage handle the boundaries so you can focus on what you do best.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center px-10 py-5 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30"
          >
            Start Your Free Trial
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>

        <p className="text-sm text-gray-400">
          14 days free • No credit card required • Cancel anytime
        </p>
      </div>
    </section>
  );
}
