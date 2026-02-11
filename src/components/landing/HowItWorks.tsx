import { useState } from 'react';

export default function HowItWorks() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  const toggleStep = (index: number) => {
    setExpandedStep(expandedStep === index ? null : index);
  };

  return (
    <section id="how-it-works" className="py-24 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Three steps. That's it.
          </p>
        </div>

        <div className="space-y-24">
          {/* Step 1 - Image Left */}
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
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white text-lg font-bold rounded-full mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Create Project
              </h3>
              <p className="text-base text-gray-500 mb-4">
                using our templates
              </p>
              
              {/* Learn More Toggle */}
              <button 
                onClick={() => toggleStep(0)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                <span>{expandedStep === 0 ? 'Show less' : 'Learn more'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${expandedStep === 0 ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expandable Description */}
              <div className={`overflow-hidden transition-all duration-300 ${expandedStep === 0 ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-base text-gray-600 mb-6">
                  Pick a template or start from scratch. Set your stages, amounts, and revision limits. Takes 3 minutes.
                </p>
                <ul className="space-y-3">
                  {[
                    'Pre-built templates for design, dev & content',
                    'Customizable stages and pricing',
                    'Optional down payment protection',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-gray-700">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-base">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Step 2 - Image Right */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white text-lg font-bold rounded-full mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Share Link
              </h3>
              <p className="text-base text-gray-500 mb-4">
                no client signup needed
              </p>
              
              {/* Learn More Toggle */}
              <button 
                onClick={() => toggleStep(1)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                <span>{expandedStep === 1 ? 'Show less' : 'Learn more'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${expandedStep === 1 ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expandable Description */}
              <div className={`overflow-hidden transition-all duration-300 ${expandedStep === 1 ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-base text-gray-600 mb-6">
                  Send a single link. No client signup needed. They see a clean portal with stages, deliverables, and payment buttons.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Pro tip:</span> Clients can pay via Stripe or mark offline payments (PayPal, bank transfer, etc.)
                  </p>
                </div>
              </div>
            </div>
            <div>
              <div className="rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white">
                <img 
                  src="/assets/screenshots/step2-stages.png" 
                  alt="Client portal"
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Step 3 - Image Left */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="rounded-xl shadow-xl border border-gray-200 overflow-hidden bg-white">
                <img 
                  src="/assets/screenshots/step3-client-portal.png" 
                  alt="Payment tracking"
                  className="w-full"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-600 text-white text-lg font-bold rounded-full mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Get Paid
              </h3>
              <p className="text-base text-gray-500 mb-4">
                automatically
              </p>
              
              {/* Learn More Toggle */}
              <button 
                onClick={() => toggleStep(2)}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                <span>{expandedStep === 2 ? 'Show less' : 'Learn more'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${expandedStep === 2 ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expandable Description */}
              <div className={`overflow-hidden transition-all duration-300 ${expandedStep === 2 ? 'max-h-96 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-base text-gray-600 mb-6">
                  When a client pays, the next stage unlocks instantly. Automated reminders chase overdue payments so you don't have to.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Real-time updates', desc: 'Instant notifications' },
                    { label: 'Auto reminders', desc: 'Stop chasing payments' },
                    { label: 'Stage locking', desc: 'No unpaid work' },
                    { label: 'Payment tracking', desc: 'See everything at a glance' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
