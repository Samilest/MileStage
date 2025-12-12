import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
            Terms of Service
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Last Updated: November 9, 2025
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Simple Version */}
            <div className="bg-green-50 border-l-4 border-green-600 p-6 mb-8 rounded-r-lg">
              <p className="text-gray-900 font-medium mb-2">The Simple Version:</p>
              <p className="text-gray-700 text-base">
                Use MileStage to track payments. Be honest. Pay your subscription. Don't abuse the system. 
                We'll provide the software, you run your business.
              </p>
            </div>

            {/* 1. What MileStage Does */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What MileStage Does</h2>
              <p className="text-gray-700 mb-4">
                We help freelancers track stage-by-stage payments and prevent scope creep.
              </p>
              <p className="text-gray-700 mb-2"><strong>What we do:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Provide the software</li>
                <li>Send automated reminders</li>
                <li>Track payment status via Stripe</li>
              </ul>
              <p className="text-gray-700 mb-2"><strong>What we don't do:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Hold your money (Stripe does that)</li>
                <li>Process payments directly</li>
                <li>Mediate disputes with your clients</li>
                <li>Provide legal or financial advice</li>
              </ul>
            </section>

            {/* 2. Who Can Use This */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Who Can Use This</h2>
              <p className="text-gray-700 mb-4">
                You need to be 18 or older and provide accurate information when signing up.
              </p>
              <p className="text-gray-700">
                One account per person. Don't share your login.
              </p>
            </section>

            {/* 3. Your Responsibilities */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Your Responsibilities</h2>
              <p className="text-gray-700 mb-2"><strong>Keep your account secure:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Use a strong password</li>
                <li>Don't share your login</li>
                <li>You're responsible for everything that happens under your account</li>
              </ul>
              <p className="text-gray-700 mb-2"><strong>Use it legally:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Follow the law in your country</li>
                <li>Don't upload anything illegal</li>
                <li>Be honest with your information</li>
              </ul>
              <p className="text-gray-700">
                If you mess up, we can suspend or close your account.
              </p>
            </section>

            {/* 4. Pricing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Pricing</h2>
              <p className="text-gray-700 mb-4">
                <strong>Free trial:</strong> 14 days, all features, no credit card needed.
              </p>
              <p className="text-gray-700 mb-2"><strong>After trial:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>$19/month (billed monthly)</li>
                <li>$144/year (billed annually, save 37%)</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Prices may change. We'll email you 30 days before any increase. You can cancel if you don't like the new price.
              </p>
              <p className="text-gray-700">
                <strong>Refunds:</strong> See our Refund Policy. Generally, we're fair about this.
              </p>
            </section>

            {/* 5. What You Can't Do */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. What You Can't Do</h2>
              <p className="text-gray-700 mb-4">
                Keep it simple. Don't:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Reverse engineer our code</li>
                <li>Copy our content</li>
                <li>Use MileStage for illegal stuff</li>
                <li>Create fake accounts</li>
                <li>Share your account with others</li>
                <li>Spam anyone</li>
                <li>Upload viruses or malware</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Common sense stuff. If it feels sketchy, don't do it.
              </p>
            </section>

            {/* 6. Your Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Data</h2>
              <p className="text-gray-700 mb-4">
                <strong>You own it:</strong> Projects, client info, payment records—all yours.
              </p>
              <p className="text-gray-700 mb-2"><strong>We use it to:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Make MileStage work</li>
                <li>Send you reminders and receipts</li>
                <li>Improve the product</li>
                <li>Comply with the law if required</li>
              </ul>
              <p className="text-gray-700 mb-2"><strong>We won't:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Sell your data</li>
                <li>Spam you</li>
                <li>Share it without permission (unless legally required)</li>
              </ul>
              <p className="text-gray-700">
                Want to delete everything? Delete your account. We'll remove your data within 30 days.
              </p>
            </section>

            {/* 7. Stripe Integration */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Stripe Integration</h2>
              <p className="text-gray-700 mb-4">
                All payments go through Stripe. You connect your Stripe account. We never touch your money.
              </p>
              <p className="text-gray-700">
                Stripe's terms apply to your transactions. We just track the status.
              </p>
            </section>

            {/* 8. What We're Not Responsible For */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. What We're Not Responsible For</h2>
              <p className="text-gray-700 mb-4">
                MileStage is software. We build it, maintain it, and improve it. But we're not liable for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Client disputes (that's between you and them)</li>
                <li>Lost income from bugs or downtime</li>
                <li>Stripe issues or payment problems</li>
                <li>Your business decisions</li>
              </ul>
              <p className="text-gray-700 mb-4">
                We're a tool, not a guarantee.
              </p>
              <p className="text-gray-700">
                We'll do our best to keep everything running smoothly. But if something goes wrong, 
                our maximum liability is what you paid us in the last 12 months.
              </p>
            </section>

            {/* 9. Canceling Your Account */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Canceling Your Account</h2>
              <p className="text-gray-700 mb-2"><strong>You can cancel anytime:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Go to Settings → Cancel</li>
                <li>You keep access until your billing period ends</li>
                <li>No refunds for unused time on monthly plans</li>
                <li>Annual plans: see Refund Policy</li>
              </ul>
              <p className="text-gray-700 mb-2"><strong>We can cancel your account if:</strong></p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You violate these terms</li>
                <li>You don't pay</li>
                <li>We shut down (we'll give you 30 days notice)</li>
              </ul>
            </section>

            {/* 10. Changes to These Terms */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to These Terms</h2>
              <p className="text-gray-700 mb-4">
                We might update these terms. If we make big changes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We'll email you 30 days ahead</li>
                <li>You can cancel if you don't agree</li>
                <li>Continuing to use MileStage means you accept the new terms</li>
              </ul>
            </section>

            {/* 11. If Something Goes Wrong */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. If Something Goes Wrong</h2>
              <p className="text-gray-700 mb-4">
                <strong>Email us first:</strong> support@milestage.com
              </p>
              <p className="text-gray-700 mb-4">
                Most issues can be sorted out with a conversation. We'll respond within 24 hours and 
                try to resolve it within 7 days.
              </p>
              <p className="text-gray-700">
                If we can't work it out, disputes go to arbitration in British Columbia, Canada.
              </p>
            </section>

            {/* 12. The Legal Stuff */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. The Legal Stuff</h2>
              <p className="text-gray-700 mb-4">
                These terms are governed by the laws of British Columbia, Canada.
              </p>
              <p className="text-gray-700 mb-4">
                If part of this agreement doesn't hold up in court, the rest still applies.
              </p>
              <p className="text-gray-700">
                We can transfer these terms to someone else (if we sell the business). You can't.
              </p>
            </section>

            {/* Questions */}
            <section className="bg-gray-50 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Questions?</h3>
              <p className="text-gray-700">
                Email: <a href="mailto:support@milestage.com" className="text-green-600 hover:text-green-700 font-medium">support@milestage.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
