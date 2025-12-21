import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple Pricing. Zero Transaction Fees.
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Competitors charge 2-3% per transaction. We charge $0. You keep 100%.
          </p>

          {/* Competitor Comparison */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                On a $1,000 project, you pay:
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">😞</span>
                    <span className="font-medium text-gray-900">Bonsai</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">-$30 (3% fees)</p>
                    <p className="text-sm text-gray-600">You keep $970</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">😞</span>
                    <span className="font-medium text-gray-900">HoneyBook</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-red-600">-$29 (2.9% fees)</p>
                    <p className="text-sm text-gray-600">You keep $971</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-600">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <span className="font-bold text-gray-900">MileStage</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">$0 fees</p>
                    <p className="text-sm font-semibold text-gray-900">You keep $1,000 ✓</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span className={`text-lg font-medium ${!isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              isAnnual ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                isAnnual ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span className={`text-lg font-medium ${isAnnual ? 'text-gray-900' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
              Save 37%
            </span>
          </span>
        </div>

        {/* Pricing Card */}
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
            <div className="text-center mb-8">
              {isAnnual ? (
                <>
                  <div className="text-5xl font-bold text-gray-900 mb-2">
                    $12<span className="text-2xl text-gray-600">/month</span>
                  </div>
                  <p className="text-gray-600">Billed annually at $144/year</p>
                </>
              ) : (
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  $19<span className="text-2xl text-gray-600">/month</span>
                </div>
              )}
            </div>

            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700">Unlimited projects</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700">Automated payment reminders</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700">Stage locking (prevent scope creep)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700">Real-time Stripe sync</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700">Client portal</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700">Multi-currency support</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 mt-1">✓</span>
                <span className="text-gray-700">Priority support</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-1">✓</span>
                <span className="text-gray-900 font-bold">Zero transaction fees</span>
              </li>
            </ul>

            <Link
              to="/signup"
              className="block w-full text-center px-8 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/30 mb-4"
            >
              Start Free Trial
            </Link>

            <p className="text-center text-sm text-gray-600">
              14-day free trial • No credit card needed • Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
