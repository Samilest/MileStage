export default function ScopeCreepPrevention() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Prevents Scope Creep Automatically
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            No awkward conversations. The system enforces boundaries for you.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <img 
              src="/assets/screenshots/locked-stages.png" 
              alt="Client portal showing locked stages until payment"
              className="rounded-xl shadow-xl border border-gray-200"
            />
          </div>
          <div>
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                <p className="font-semibold text-gray-900 mb-2">"Can we start revisions while payment processes?"</p>
                <p className="text-gray-700">→ Stage locked. Pay Stage 1 first.</p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                <p className="font-semibold text-gray-900 mb-2">"Can we add one more round of changes?"</p>
                <p className="text-gray-700">→ Create new stage. Get paid first.</p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                <p className="font-semibold text-gray-900 mb-2">"Can we just do a quick extra thing?"</p>
                <p className="text-gray-700">→ Quick things = new stage = payment required.</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
              <p className="text-gray-900 font-medium">
                No awkward conversations. No explaining your boundaries. The system does it for you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
