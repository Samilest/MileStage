export default function ScopeCreepPrevention() {
  const scenarios = [
    {
      question: '"Can we start revisions while payment processes?"',
      answer: 'Stage locked. Payment required first.',
    },
    {
      question: '"Can we add one more round of changes?"',
      answer: 'Revisions tracked. Extra rounds require payment.',
    },
    {
      question: '"Can we skip ahead to final delivery?"',
      answer: 'Stages complete in order. No skipping.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Prevents Scope Creep Automatically
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            No awkward conversations. The system enforces boundaries for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Scenarios */}
          <div className="space-y-4">
            {scenarios.map((scenario, index) => (
              <div 
                key={index} 
                className="bg-gray-50 border-l-4 border-gray-300 p-5 rounded-r-lg"
              >
                <p className="font-medium text-gray-900 mb-2 text-sm">
                  {scenario.question}
                </p>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <span className="text-red-500">→</span>
                  {scenario.answer}
                </p>
              </div>
            ))}

            {/* Benefits box */}
            <div className="mt-8 p-6 bg-green-50 rounded-xl border border-green-200">
              <p className="font-semibold text-gray-900 mb-4 text-sm">
                System enforces boundaries:
              </p>
              <ul className="space-y-2">
                {[
                  'Stages lock until payment clears',
                  'Revisions tracked per stage',
                  'Work progresses in order',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                    <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Screenshot */}
          <div>
            <div className="rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white">
              <img 
                src="/assets/screenshots/locked-stages.png" 
                alt="Locked stages in client portal"
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Bottom callout */}
        <div className="mt-16 max-w-2xl mx-auto">
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Revision Tracking Built-In
            </h3>
            <p className="text-gray-600 text-sm">
              Each stage includes set revisions. When clients exceed their limit, they purchase additional rounds through the portal. No more "shadow work."
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
