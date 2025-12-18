export default function ScopeCreepPrevention() {
  const scenarios = [
    {
      question: 'Can we start revisions while payment processes?',
      answer: 'Stage locked. Pay Stage 1 first.',
    },
    {
      question: 'Can we add one more round of changes?',
      answer: 'Out of free revisions. Buy extra revision for $X or new stage.',
    },
    {
      question: 'What's the latest update on Stage 2?',
      answer: 'Check your portal—all updates posted there.',
    },
    {
      question: 'Can you approve this so I can move forward?',
      answer: 'Use the approval button in your portal.',
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl lg:text-5xl font-bold text-black text-center mb-6">
          Prevents Scope Creep Automatically
        </h2>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          The system enforces boundaries so you don't have to have awkward conversations.
        </p>

        <div className="space-y-8">
          {scenarios.map((scenario, index) => (
            <div 
              key={index}
              className="bg-gray-50 rounded-2xl p-8 lg:p-10 border border-gray-100 hover:border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-default"
            >
              <p className="text-lg lg:text-xl italic text-gray-600 mb-4">
                "{scenario.question}"
              </p>
              <p className="text-lg lg:text-xl text-black font-semibold">
                → {scenario.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-green-50 rounded-2xl p-8 border border-green-100 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] cursor-default">
          <p className="text-xl lg:text-2xl text-black font-bold mb-2">
            No awkward conversations.
          </p>
          <p className="text-lg text-gray-700">
            The system enforces boundaries for you.
          </p>
        </div>
      </div>
    </section>
  );
}
