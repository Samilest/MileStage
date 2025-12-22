export default function Comparison() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Zero Transaction Fees
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-4">
            Most freelance tools charge 2-3% per transaction.
          </p>
          <p className="text-2xl font-bold text-gray-900">
            We charge 0%.
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 mb-16">
          {/* Industry Standard */}
          <div className="bg-red-50 rounded-2xl p-8 border-2 border-red-200">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Industry Standard</h3>
              <p className="text-sm text-gray-600">Most freelance platforms</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-700">$1,000 project</span>
                <span className="font-semibold text-red-600">-$25-30 fees</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-700">$5,000 project</span>
                <span className="font-semibold text-red-600">-$145-150 fees</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-700">$10,000 project</span>
                <span className="font-semibold text-red-600">-$290-300 fees</span>
              </div>
            </div>

            <div className="text-center p-4 bg-red-100 rounded-lg">
              <p className="text-sm text-gray-700">Over 10 projects/year:</p>
              <p className="text-2xl font-bold text-red-700">Lose $1,450-1,500</p>
            </div>
          </div>

          {/* MileStage */}
          <div className="bg-green-50 rounded-2xl p-8 border-2 border-green-600 relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                You Keep 100%
              </span>
            </div>

            <div className="text-center mb-6 mt-2">
              <h3 className="text-xl font-bold text-gray-900 mb-2">MileStage</h3>
              <p className="text-sm text-gray-600">Zero transaction fees</p>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-700">$1,000 project</span>
                <span className="font-semibold text-green-600">$0 fees</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-700">$5,000 project</span>
                <span className="font-semibold text-green-600">$0 fees</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-white rounded-lg">
                <span className="text-gray-700">$10,000 project</span>
                <span className="font-semibold text-green-600">$0 fees</span>
              </div>
            </div>

            <div className="text-center p-4 bg-green-100 rounded-lg">
              <p className="text-sm text-gray-700">Over 10 projects/year:</p>
              <p className="text-2xl font-bold text-green-700">Save $1,450-1,500</p>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-4">
            That's enough to cover your subscription for <span className="font-bold text-gray-900">6+ years</span>.
          </p>
          <p className="text-sm text-gray-500">
            Just $19/month. No hidden fees. Ever.
          </p>
        </div>
      </div>
    </section>
  );
}
