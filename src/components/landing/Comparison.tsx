export default function Comparison() {
  const comparisons = [
    { traditional: 'Track tasks', milestage: 'Enforce boundaries' },
    { traditional: 'Flexible (to a fault)', milestage: 'Rules-based stages' },
    { traditional: 'Endless revisions', milestage: 'Revision limits' },
    { traditional: 'Payment handled elsewhere', milestage: 'Payment tied to progress' },
    { traditional: 'Client negotiates scope', milestage: 'Scope is predefined' },
  ];

  return (
    <section className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl lg:text-5xl font-bold text-black text-center mb-6">
          Not Another PM Tool
        </h2>
        <p className="text-xl text-gray-600 text-center mb-16 max-w-2xl mx-auto">
          MileStage is a boundary system for client-facing work where power isn't equal.
        </p>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-2 divide-x divide-gray-200">
            {/* Headers */}
            <div className="bg-gray-50 px-8 py-5 font-semibold text-lg text-gray-600 text-center border-b border-gray-200">
              Traditional PM Tools
            </div>
            <div className="bg-green-50 px-8 py-5 font-semibold text-lg text-green-700 text-center border-b border-green-200">
              MileStage
            </div>
          </div>

          {/* Comparison Rows */}
          {comparisons.map((item, index) => (
            <div 
              key={index} 
              className="grid md:grid-cols-2 divide-x divide-gray-200 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors"
            >
              <div className="px-8 py-6 text-gray-600 text-center md:text-left">
                {item.traditional}
              </div>
              <div className="px-8 py-6 text-black font-medium text-center md:text-left bg-green-50/30">
                {item.milestage}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-lg text-gray-600 mt-8">
          This reframes MileStage as a <span className="font-semibold text-black">business protection tool</span>, not a PM tool.
        </p>
      </div>
    </section>
  );
}
