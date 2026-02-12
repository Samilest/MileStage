export default function ScopeCreepPrevention() {
  const scenarios = [
    {
      question: '"Can we start revisions while payment processes?"',
      answer: 'Stage locked. Payment required first.',
    },
    {
      question: '"Can we add one more round of changes?"',
      answer: 'Extra rounds require payment.',
    },
    {
      question: '"Can we skip ahead to final delivery?"',
      answer: 'Stages complete in order. No skipping.',
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Prevents Scope Creep Automatically
          </h2>
          <p className="text-lg text-gray-500">
            The system enforces boundaries. No awkward conversations.
          </p>
        </div>

        {/* Simple 3-column layout */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {scenarios.map((scenario, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-xl p-6 text-center"
            >
              <p className="text-sm text-gray-900 font-medium mb-3">
                {scenario.question}
              </p>
              <p className="text-sm text-green-600 font-semibold">
                → {scenario.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom summary */}
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Stages lock until paid
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Revisions tracked per stage
          </span>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Work progresses in order
          </span>
        </div>
      </div>
    </section>
  );
}
