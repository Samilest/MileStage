import { useNavigate } from 'react-router-dom';

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-32 lg:py-40 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <h2 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-black mb-12 leading-tight">
          Stop Chasing
          <br />
          Payments
        </h2>
        
        <button
          onClick={() => navigate('/signup')}
          className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold px-12 py-5 rounded-xl text-xl transition-all duration-200 hover:scale-105 shadow-xl hover:shadow-2xl mb-6 group"
        >
          <span>Start Free Trial</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>

        <p className="text-gray-600 text-lg">
          14 days free · Cancel anytime
        </p>
      </div>
    </section>
  );
}
