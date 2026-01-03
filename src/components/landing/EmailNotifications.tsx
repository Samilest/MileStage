// src/components/landing/EmailNotifications.tsx
export default function EmailNotifications() {
  return (
    <section className="py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Section Title */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-black mb-4">
            Never Miss a Beat
          </h2>
          <p className="text-xl text-gray-600">
            Automated notifications keep everyone informed with accurate, real-time updates
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-16">
          
          {/* Freelancers Column */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-6">
              For Freelancers
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Payment received (Stripe & offline)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Stage approved by client</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Revision requested</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Client viewed project</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Extra revision purchased</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Project completed (with earnings summary)</span>
              </li>
            </ul>
          </div>

          {/* Clients Column */}
          <div>
            <h3 className="text-2xl font-bold text-black mb-6">
              For Clients
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Project invitation received</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Work delivered for review</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Payment confirmed</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Payment verified</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-500 text-xl mt-0.5">✓</span>
                <span className="text-gray-700">Payment reminders (optional)</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Line */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-700">
            Professional branded design. Clear action buttons. Zero manual follow-ups.
          </p>
        </div>

      </div>
    </section>
  );
}
