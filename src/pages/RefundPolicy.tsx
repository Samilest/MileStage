import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LandingFooter from '../components/landing/LandingFooter';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Refund Policy
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Last Updated: November 9, 2025
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Simple Version */}
            <div className="bg-green-50 border-l-4 border-green-600 p-6 mb-8 rounded-r-lg">
              <p className="text-gray-900 font-medium mb-2">The Simple Version:</p>
              <p className="text-gray-700 text-base">
                Try MileStage free for 14 days. Not happy after you pay? Email us within 14 days for a full refund. No hassle.
              </p>
            </div>

            {/* 1. Free Trial */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Free Trial (14 Days)</h2>
              <p className="text-gray-700 mb-4">
                Try MileStage free for 14 days:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>All features unlocked</li>
                <li>Unlimited projects</li>
                <li>No charge from MileStage</li>
                <li>Cancel anytime</li>
              </ul>
              <p className="text-gray-700 mb-4">
                To receive payments from clients, you'll connect your Stripe account (free, but requires bank details for payouts).
              </p>
              <p className="text-gray-700 mb-4">
                Cancel anytime during the trial. No questions, no charges from MileStage.
              </p>
              <p className="text-gray-700 font-medium">
                Use the trial. Really test it. Make sure it works for you before paying.
              </p>
            </section>

            {/* 2. Monthly Plan Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Monthly Plan Refunds</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">First payment:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Full refund if you ask within 14 days</li>
                <li>Just email us: support@milestage.com</li>
                <li>We'll process it within 5-7 business days</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">After 14 days:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>No refunds for the current month</li>
                <li>But you can cancel anytime</li>
                <li>You keep access until your billing period ends</li>
                <li>No charges after that</li>
              </ul>
            </section>

            {/* 3. Annual Plan Refunds */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Annual Plan Refunds</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Within 30 days of payment:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>We'll refund you for the unused time</li>
                <li>Example: Used 1 month? Refund for 11 months.</li>
                <li>Email us: support@milestage.com</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">After 30 days:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>No refunds</li>
                <li>But you can cancel</li>
                <li>You keep access until your year is up</li>
                <li>Switch to monthly when it renews</li>
              </ul>
            </section>

            {/* 4. How to Get a Refund */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Get a Refund</h2>
              <p className="text-gray-700 mb-4">
                <strong>Email:</strong> support@milestage.com
              </p>
              <p className="text-gray-700 mb-2"><strong>Tell us:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Your account email</li>
                <li>Why you're requesting a refund (optional, helps us improve)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                We'll respond within 24 hours.
              </p>
              <p className="text-gray-700">
                Refunds are processed in 5-7 business days.
              </p>
            </section>

            {/* 5. What We Don't Refund */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. What We Don't Refund</h2>
              <p className="text-gray-700 mb-4">
                No refunds for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Accounts we closed for breaking our terms</li>
                <li>Monthly plans after the 14-day window</li>
                <li>Annual plans used for more than 30 days</li>
                <li>Time you didn't use (it's a subscription, not pay-per-use)</li>
              </ul>
              <p className="text-gray-700">
                We're fair. But we can't refund every situation.
              </p>
            </section>

            {/* 6. Before You Chargeback */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Before You Chargeback</h2>
              <p className="text-gray-700 mb-4">
                If something's wrong, talk to us first.
              </p>
              <p className="text-gray-700 mb-4">
                Chargebacks cost us fees and create headaches. Most issues can be solved with a quick email.
              </p>
              <p className="text-gray-700">
                If you file a chargeback without contacting us, we'll have to close your account.
              </p>
            </section>

            {/* 7. Service Problems */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Service Problems</h2>
              <p className="text-gray-700 mb-4">
                If MileStage goes down for a long time:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>We'll extend your subscription to make up for it</li>
                <li>Email us if this happens</li>
              </ul>

              <p className="text-gray-700 mb-2"><strong>We don't refund for:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Brief outages (under an hour)</li>
                <li>Your internet/browser issues</li>
                <li>Problems with Stripe or other services we use</li>
              </ul>

              <p className="text-gray-700">
                We work hard to keep things running. But sometimes stuff breaks. We'll fix it fast.
              </p>
            </section>

            {/* 8. Fair Use */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Fair Use</h2>
              <p className="text-gray-700 mb-4">
                We're generous with refunds for legitimate requests.
              </p>
              <p className="text-gray-700 mb-4">
                But if we see abuse (multiple trials, fraud, gaming the system), we'll deny the refund.
              </p>
              <p className="text-gray-700">
                Be honest, we'll be fair.
              </p>
            </section>

            {/* Questions */}
            <section className="bg-gray-50 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Questions?</h3>
              <p className="text-gray-700 mb-2">
                Email: <a href="mailto:support@milestage.com" className="text-green-600 hover:text-green-700 font-medium">support@milestage.com</a>
              </p>
              <p className="text-gray-700 mb-4">
                We respond fast. Usually within a few hours.
              </p>
              <p className="text-gray-700 font-medium">
                Bottom line: Try it free. If it's not for you after paying, we'll refund you. Simple.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
