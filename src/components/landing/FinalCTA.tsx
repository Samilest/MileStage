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
          className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-semibold px-12 py-5 rounded-xl text-xl transition-all duration-300 hover:scale-110 shadow-xl hover:shadow-2xl mb-6 group relative overflow-hidden"
        >
          <span className="relative z-10">Start Free Trial</span>
          <span className="relative z-10 group-hover:translate-x-2 transition-transform duration-300">→</span>
          <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        <p className="text-gray-600 text-lg">
          14 days free · Cancel anytime
        </p>
      </div>
    </section>
  );
}
