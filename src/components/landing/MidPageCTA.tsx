import { Link } from 'react-router-dom';

export default function MidPageCTA() {
  return (
    <section className="py-20 bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Headline */}
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
          Ready to Stop Chasing Payments?
        </h2>
        
        {/* Subtext */}
        <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
          Join freelancers who track stage-by-stage payments automatically. 
          No more scope creep, no more awkward conversations.
        </p>

        {/* CTA Button */}
        <Link
          to="/signup"
          className="inline-block bg-green-600 text-white text-lg px-10 py-4 rounded-lg hover:bg-green-700 transition-colors font-semibold shadow-lg"
        >
          Start Free Trial →
        </Link>

        {/* Trust Elements */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm text-gray-400">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>No credit card</span>
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>14 days free</span>
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Cancel anytime</span>
          </span>
        </div>
      </div>
    </section>
  );
}
