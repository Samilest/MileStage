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

        <div className="space-y-32">
          {/* Step 1 */}
          <div>
            {/* Title row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white text-lg font-bold rounded-full flex items-center justify-center">
                1
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Create Project</h3>
                <p className="text-base text-gray-500">using our templates</p>
              </div>
              <button 
                onClick={() => toggleStep(0)}
                className="ml-auto flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                <span>{expandedStep === 0 ? 'Show less' : 'Learn more'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${expandedStep === 0 ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expandable Description */}
            <div className={`overflow-hidden transition-all duration-300 mb-6 ${expandedStep === 0 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pl-16">
                <p className="text-base text-gray-600 mb-4">
                  Pick a template or start from scratch. Set your stages, amounts, and revision limits. Takes 3 minutes.
                </p>
                <ul className="space-y-2">
                  {['Pre-built templates for design, dev & content', 'Customizable stages and pricing', 'Optional down payment protection'].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Large Image */}
            <div className="rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
              <img 
                src="/assets/screenshots/step1-create-project.png" 
                alt="Create project"
                className="w-full"
              />
            </div>
          </div>

          {/* Step 2 */}
          <div>
            {/* Title row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white text-lg font-bold rounded-full flex items-center justify-center">
                2
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Share Link</h3>
                <p className="text-base text-gray-500">no client signup needed</p>
              </div>
              <button 
                onClick={() => toggleStep(1)}
                className="ml-auto flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                <span>{expandedStep === 1 ? 'Show less' : 'Learn more'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${expandedStep === 1 ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expandable Description */}
            <div className={`overflow-hidden transition-all duration-300 mb-6 ${expandedStep === 1 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pl-16">
                <p className="text-base text-gray-600 mb-4">
                  Send a single link. No client signup needed. They see a clean portal with stages, deliverables, and payment buttons.
                </p>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 inline-block">
                  <p className="text-sm text-green-800">
                    <span className="font-semibold">Pro tip:</span> Clients can pay via Stripe or mark offline payments
                  </p>
                </div>
              </div>
            </div>

            {/* Large Image */}
            <div className="rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
              <img 
                src="/assets/screenshots/step2-stages.png" 
                alt="Client portal"
                className="w-full"
              />
            </div>
          </div>

          {/* Step 3 */}
          <div>
            {/* Title row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white text-lg font-bold rounded-full flex items-center justify-center">
                3
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Get Paid</h3>
                <p className="text-base text-gray-500">automatically</p>
              </div>
              <button 
                onClick={() => toggleStep(2)}
                className="ml-auto flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm"
              >
                <span>{expandedStep === 2 ? 'Show less' : 'Learn more'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-300 ${expandedStep === 2 ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Expandable Description */}
            <div className={`overflow-hidden transition-all duration-300 mb-6 ${expandedStep === 2 ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="pl-16">
                <p className="text-base text-gray-600 mb-4">
                  When a client pays, the next stage unlocks instantly. Automated reminders chase overdue payments so you don't have to.
                </p>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: 'Real-time updates' },
                    { label: 'Auto reminders' },
                    { label: 'Stage locking' },
                    { label: 'Payment tracking' },
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-gray-700 text-sm">
                      <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {item.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Large Image */}
            <div className="rounded-2xl shadow-2xl border border-gray-200 overflow-hidden bg-white">
              <img 
                src="/assets/screenshots/step3-client-portal.png" 
                alt="Payment tracking"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
