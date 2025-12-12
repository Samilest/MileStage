import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Last Updated: November 9, 2025
          </p>

          <div className="prose prose-lg max-w-none">
            {/* Simple Version */}
            <div className="bg-green-50 border-l-4 border-green-600 p-6 mb-8 rounded-r-lg">
              <p className="text-gray-900 font-medium mb-2">Simple version:</p>
              <p className="text-gray-700 text-base">
                We collect minimal data, never sell it, and protect it.
              </p>
            </div>

            {/* 1. What We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Account Information:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Email address</li>
                <li>Name</li>
                <li>Password (encrypted)</li>
                <li>Billing details (processed by Stripe)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Project Information:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Project names</li>
                <li>Stage details</li>
                <li>Payment amounts</li>
                <li>Client names (optional)</li>
                <li>Due dates</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">Automatically Collected:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>IP address</li>
                <li>Browser type</li>
                <li>Device information</li>
                <li>Usage data (pages visited, features used)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">We DON'T collect:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Credit card numbers (Stripe handles this)</li>
                <li>Social security numbers</li>
                <li>Unnecessary personal information</li>
              </ul>
            </section>

            {/* 2. How We Use Your Data */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. How We Use Your Data</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">To provide the service:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Create and manage your account</li>
                <li>Track projects and payments</li>
                <li>Send automated reminders</li>
                <li>Process billing</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">To improve MileStage:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Analyze usage patterns</li>
                <li>Fix bugs</li>
                <li>Add features users want</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">To communicate:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Send transactional emails (payment confirmations, reminders)</li>
                <li>Send account updates (password resets, billing issues)</li>
                <li>Send product updates (optional, you can opt out)</li>
              </ul>
            </section>

            {/* 3. Who We Share Data With */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Who We Share Data With</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Service providers we use:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li><strong>Supabase</strong> (database hosting) - stores your data</li>
                <li><strong>Stripe</strong> (payment processing) - handles subscriptions</li>
                <li><strong>Resend</strong> (email delivery) - sends transactional emails</li>
                <li><strong>Vercel</strong> (hosting) - serves the application</li>
              </ul>

              <p className="text-gray-700 mb-4">
                We share ONLY what's necessary for these services to work.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">We DON'T share with:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Advertisers</li>
                <li>Data brokers</li>
                <li>Anyone else (unless legally required)</li>
              </ul>
            </section>

            {/* 4. Cookies & Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookies & Tracking</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">We use cookies for:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Keeping you logged in</li>
                <li>Remembering preferences</li>
                <li>Analytics (optional, anonymized)</li>
              </ul>

              <p className="text-gray-700 mb-4">
                You can disable cookies, but MileStage won't work properly.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">We DON'T use:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>Third-party advertising cookies</li>
                <li>Tracking pixels for ads</li>
              </ul>
            </section>

            {/* 5. Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">How we protect your data:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Encryption in transit (HTTPS/SSL)</li>
                <li>Encryption at rest (database)</li>
                <li>Secure password hashing</li>
                <li>Regular security updates</li>
                <li>Access controls (only authorized personnel)</li>
              </ul>

              <p className="text-gray-700">
                No system is 100% secure. We do our best, but we can't guarantee absolute security.
              </p>
            </section>

            {/* 6. Your Rights */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">You can:</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
                <li>Access your data (download from Settings)</li>
                <li>Correct your data (edit in Settings)</li>
                <li>Delete your data (delete account = we delete everything within 30 days)</li>
                <li>Export your data (CSV download)</li>
                <li>Opt out of marketing emails (we barely send any)</li>
              </ul>

              <p className="text-gray-700">
                <strong>To exercise these rights:</strong> Email privacy@milestage.com
              </p>
            </section>

            {/* 7. Data Retention */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Active accounts:</strong> We keep your data as long as your account is active</li>
                <li><strong>Deleted accounts:</strong> We delete your data within 30 days of account deletion</li>
                <li><strong>Legal requirements:</strong> We may keep data longer if legally required (tax records, dispute resolution)</li>
                <li><strong>Backups:</strong> Deleted data may remain in backups for up to 90 days</li>
              </ul>
            </section>

            {/* 8. International Users */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Users</h2>
              <p className="text-gray-700 mb-4">
                MileStage is based in Canada. If you're outside Canada, your data may be processed in Canada. 
                By using MileStage, you consent to this.
              </p>
              <p className="text-gray-700">
                <strong>For EU users:</strong> We comply with GDPR. You have additional rights under GDPR 
                (data portability, right to be forgotten, etc.). Email us to exercise these rights.
              </p>
            </section>

            {/* 9. Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700">
                MileStage is not for children under 18. We don't knowingly collect data from minors. 
                If we discover we have, we'll delete it immediately.
              </p>
            </section>

            {/* 10. Changes to Privacy Policy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to Privacy Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this policy. If we make major changes:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We'll email you 30 days in advance</li>
                <li>We'll post the new policy on our website</li>
                <li>Continued use = you accept new policy</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="bg-gray-50 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Contact Us</h3>
              <p className="text-gray-700">
                Questions about privacy? Email: <a href="mailto:privacy@milestage.com" className="text-green-600 hover:text-green-700 font-medium">privacy@milestage.com</a>
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
