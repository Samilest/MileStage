export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps. Set up in 3 minutes.
          </p>
        </div>

        <div className="space-y-32">
          {/* Step 1 */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/assets/screenshots/step1-create-project.png" 
                alt="Create project with template selection"
                className="rounded-2xl shadow-2xl border border-gray-200 w-full"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 text-white font-bold text-xl rounded-xl mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Create Project in 3 Minutes
              </h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Pick a template (design, development, content) or build custom stages. Set amounts, deliverables, and revisions.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Pre-built templates save you time</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Optional down payment (Stage 0)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Multi-currency support (USD, EUR, GBP...)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 text-white font-bold text-xl rounded-xl mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Client Pays Stage-by-Stage
              </h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Send your client a clean portal link. They see each stage with a "Pay Now" button. Next stage stays locked until current is paid.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Stage 0: Deposit → Stage 1: Concepts → Stage 2: Revisions</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Payment via Stripe or offline (PayPal, bank transfer)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Professional client portal (no MileStage branding)</span>
                </li>
              </ul>
            </div>
            <div>
              <img 
                src="/assets/screenshots/step2-stages.png" 
                alt="Stage breakdown with payment amounts"
                className="rounded-2xl shadow-2xl border border-gray-200 w-full"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/assets/screenshots/step3-client-portal.png" 
                alt="Client portal with payment buttons"
                className="rounded-2xl shadow-2xl border border-gray-200 w-full"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-green-600 text-white font-bold text-xl rounded-xl mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Track Automatically
              </h3>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Status updates in real-time. Reminders send themselves. You focus on work, not admin.
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Payment received? Stage unlocks instantly</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Automated email reminders (optional, customizable)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-600 mt-1 text-xl">✓</span>
                  <span>Dashboard shows everything at a glance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
