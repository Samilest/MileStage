export default function TargetAudience() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl lg:text-5xl font-bold text-black text-center mb-16">
          Built For
        </h2>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Who it's for */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-green-600 mb-6">✅ Perfect For</h3>
            <div className="space-y-4">
              {[
                'Freelance designers',
                'Branding studios',
                'Web developers',
                'Content creators',
                'Agencies working in stages',
                'Consultants billing per phase',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-lg text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Who it's NOT for */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-600 mb-6">❌ Not Built For</h3>
            <div className="space-y-4">
              {[
                'Sprint planning',
                'Internal dev teams',
                'Hourly billing',
                'Task management only',
                'Teams without client work',
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-lg text-gray-500">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-2xl p-8 border border-green-100 text-center">
          <p className="text-xl text-gray-700 leading-relaxed">
            <span className="font-semibold text-black">Built for client-facing work</span> where clear boundaries prevent scope creep and payment delays.
          </p>
        </div>
      </div>
    </section>
  );
}
