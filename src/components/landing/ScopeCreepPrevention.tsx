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
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                <p className="font-semibold text-gray-900 mb-2">
                  "Can we start revisions while payment processes?"
                </p>
                <p className="text-gray-700">
                  → Stage locked. Pay Stage 1 first.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                <p className="font-semibold text-gray-900 mb-2">
                  "Can we add one more round of changes?"
                </p>
                <p className="text-gray-700">
                  → Revisions tracked. Extra rounds = extra stage = payment required.
                </p>
              </div>

              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-lg">
                <p className="font-semibold text-gray-900 mb-2">
                  "Can we just do a quick extra thing?"
                </p>
                <p className="text-gray-700">
                  → New deliverable = new stage. Get paid first.
                </p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-green-50 rounded-xl border-2 border-green-600">
              <p className="text-lg font-semibold text-gray-900 mb-2">
                System enforces boundaries automatically:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Stages lock until payment clears</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Revisions tracked per stage (clients can purchase extra)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>No awkward "that's extra" conversations</span>
                </li>
              </ul>
            </div>
          </div>

          <div>
            <img 
              src="/assets/screenshots/locked-stages.png" 
              alt="Client portal showing locked stages until payment"
              className="rounded-2xl shadow-2xl border border-gray-200 w-full"
            />
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Revision Tracking Built-In
            </h3>
            <p className="text-gray-700 mb-4">
              Each stage includes a set number of revisions. When clients request more, they can purchase additional rounds directly through the portal.
            </p>
            <p className="text-sm text-gray-600">
              No more "shadow work" through chat. Every revision is tracked and paid.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
