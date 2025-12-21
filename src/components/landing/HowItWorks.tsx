export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps. No complexity. Just results.
          </p>
        </div>

        <div className="space-y-24">
          {/* Step 1 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/assets/screenshots/step1-create-project.png" 
                alt="Create project with template selection"
                className="rounded-xl shadow-xl border border-gray-200"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white font-bold rounded-lg mb-4">
                1
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Create Project
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Pick a template, customize stages, set amounts. Takes 3 minutes.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Pre-built templates for design, development & content</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Or create custom stages from scratch</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Optional down payment (Stage 0)</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white font-bold rounded-lg mb-4">
                2
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Client Pays Stage-by-Stage
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Send project link. Client sees clear stages with payment buttons. They pay when ready.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Stage 0: Deposit → Stage 1: Concepts → Stage 2: Revisions</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Next stage locked until current is paid</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Payments via Stripe or offline (PayPal, bank transfer)</span>
                </li>
              </ul>
            </div>
            <div>
              <img 
                src="/assets/screenshots/step2-stages.png" 
                alt="Stage breakdown with payment amounts"
                className="rounded-xl shadow-xl border border-gray-200"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img 
                src="/assets/screenshots/step3-client-portal.png" 
                alt="Client portal with payment buttons"
                className="rounded-xl shadow-xl border border-gray-200"
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white font-bold rounded-lg mb-4">
                3
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Track Automatically
              </h3>
              <p className="text-lg text-gray-600 mb-4">
                Status updates in real-time. Reminders send themselves. You focus on work, not admin.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Payment received? Stage unlocks instantly</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span>Automated email reminders (optional)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
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
