export default function EmailNotifications() {
  const freelancerNotifications = [
    'Payment received (Stripe & offline)',
    'Stage approved by client',
    'Revision requested',
    'Client viewed project',
    'Extra revision purchased',
    'Project completed',
  ];

  const clientNotifications = [
    'Project invitation',
    'Work delivered for review',
    'Payment confirmed',
    'Payment verified',
    'Payment reminders (optional)',
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Never Miss a Beat
          </h2>
          <p className="text-lg text-gray-600">
            Automated notifications keep everyone informed
          </p>
        </div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Freelancers */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              For Freelancers
            </h3>
            <ul className="space-y-3">
              {freelancerNotifications.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-base text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Clients */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              For Clients
            </h3>
            <ul className="space-y-3">
              {clientNotifications.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-base text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom note */}
        <div className="mt-12 text-center">
          <p className="text-base text-gray-600">
            Professional branded emails. Clear action buttons. Zero manual follow-ups.
          </p>
        </div>
      </div>
    </section>
  );
}
