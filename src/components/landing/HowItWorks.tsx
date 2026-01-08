export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Three steps. No complexity. Just results.
          </p>
        </div>

        <div className="space-y-20 lg:space-y-32">
          {/* Step 1 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white">
                <img 
                  src="/assets/screenshots/step1-create-project.png" 
                  alt="Create project"
                  className="w-full"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white text-sm font-bold rounded-lg mb-5">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Create Project
              </h3>
              <p className="text-gray-600 mb-6">
                Pick a template, customize stages, set amounts. Takes 3 minutes.
              </p>
              <ul className="space-y-3">
                {[
                  'Pre-built templates for design, dev & content',
                  'Or create custom stages from scratch',
                  'Optional down payment (Stage 0)',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Step 2 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white text-sm font-bold rounded-lg mb-5">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Deliver → Approve → Pay
              </h3>
              <p className="text-gray-600 mb-6">
                Upload deliverables. Client approves. Payment unlocks. Next stage begins.
              </p>
              <ul className="space-y-3">
                {[
                  'Client reviews & approves your work',
                  'Payment unlocks after approval',
                  'Next stage unlocks after payment',
                  'Stripe or offline payments supported',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white">
                <img 
                  src="/assets/screenshots/step2-stages.png" 
                  alt="Stage workflow"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white">
                <img 
                  src="/assets/screenshots/step3-client-portal.png" 
                  alt="Client portal"
                  className="w-full"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-green-600 text-white text-sm font-bold rounded-lg mb-5">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Track Automatically
              </h3>
              <p className="text-gray-600 mb-6">
                Status updates in real-time. Reminders send themselves. Focus on work.
              </p>
              <ul className="space-y-3">
                {[
                  'Payment received? Stage unlocks instantly',
                  'Automated email reminders (optional)',
                  'Dashboard shows everything at a glance',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-700">
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
