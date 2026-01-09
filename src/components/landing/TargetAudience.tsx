export default function TargetAudience() {
  const perfectFor = [
    'Freelance designers',
    'Branding studios',
    'Web developers',
    'Content creators',
    'Agencies working in stages',
    'Consultants billing per phase',
  ];

  const notFor = [
    'Sprint planning',
    'Internal dev teams',
    'Hourly billing',
    'Task management only',
    'Teams without client work',
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 text-center mb-16">
          Built For
        </h2>

        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Perfect For */}
          <div>
            <h3 className="text-lg font-semibold text-green-600 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Perfect For
            </h3>
            <ul className="space-y-3">
              {perfectFor.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-base text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Not For */}
          <div>
            <h3 className="text-lg font-semibold text-gray-500 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Not Built For
            </h3>
            <ul className="space-y-3">
              {notFor.map((item, index) => (
                <li key={index} className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-base text-gray-500">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom callout */}
        <div className="bg-green-50 rounded-xl p-6 border border-green-100 text-center">
          <p className="text-base text-gray-700">
            <span className="font-semibold text-gray-900">Built for client-facing work</span> where clear boundaries prevent scope creep and payment delays.
          </p>
        </div>
      </div>
    </section>
  );
}
