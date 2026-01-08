export default function Comparison() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Zero Transaction Fees
          </h2>
          <p className="text-lg text-gray-600">
            Most freelance tools charge 2-3% per transaction. <span className="font-semibold text-gray-900">We charge 0%.</span>
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Industry Standard */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="font-semibold text-gray-900">Industry Standard</h3>
              <p className="text-sm text-gray-500">Most freelance platforms</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {[
                { project: '$1,000', fee: '-$25-30' },
                { project: '$5,000', fee: '-$145' },
                { project: '$10,000', fee: '-$290' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 text-sm">{item.project} project</span>
                  <span className="font-medium text-red-600 text-sm">{item.fee}</span>
                </div>
              ))}
            </div>

            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">10 projects/year:</p>
              <p className="text-xl font-bold text-red-600">-$1,450+</p>
            </div>
          </div>

          {/* MileStage */}
          <div className="bg-white rounded-xl p-6 border-2 border-green-600 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Keep 100%
              </span>
            </div>

            <div className="text-center mb-6 mt-2">
              <h3 className="font-semibold text-gray-900">MileStage</h3>
              <p className="text-sm text-gray-500">Zero transaction fees</p>
            </div>
            
            <div className="space-y-3 mb-6">
              {[
                { project: '$1,000', fee: '$0' },
                { project: '$5,000', fee: '$0' },
                { project: '$10,000', fee: '$0' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700 text-sm">{item.project} project</span>
                  <span className="font-medium text-green-600 text-sm">{item.fee} fees</span>
                </div>
              ))}
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">10 projects/year:</p>
              <p className="text-xl font-bold text-green-600">Save $1,450+</p>
            </div>
          </div>
        </div>

        {/* Bottom note */}
        <div className="text-center">
          <p className="text-gray-600">
            That's enough to cover your subscription for <span className="font-semibold text-gray-900">6+ years</span>.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Just $19/month. No hidden fees.
          </p>
        </div>
      </div>
    </section>
  );
}
