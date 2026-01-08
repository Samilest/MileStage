export default function ClientApprovals() {
  const benefits = [
    "Client can't proceed until they approve & pay",
    'Automated reminders chase approvals',
    'No more projects stuck in limbo',
    'No more chasing for feedback',
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Quote Block */}
        <div className="bg-white rounded-xl p-8 border border-gray-200 mb-12">
          <svg className="w-8 h-8 text-gray-300 mb-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
          </svg>
          <p className="text-lg text-gray-700 leading-relaxed mb-4 italic">
            "I have several projects I can't get over the line, due to the client not approving or providing content."
          </p>
          <p className="text-sm text-gray-500">
            — Web Designer, 20 years experience
          </p>
        </div>

        {/* Solution */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Sound familiar?
          </h2>
          <p className="text-gray-600">
            MileStage fixes this:
          </p>
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-12">
          {benefits.map((benefit, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-100"
            >
              <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-gray-700">{benefit}</p>
            </div>
          ))}
        </div>

        {/* Bottom Highlight */}
        <div className="text-center p-6 bg-green-50 rounded-xl border border-green-100">
          <p className="text-xl font-semibold text-gray-900 mb-1">
            Approve = Pay = Progress
          </p>
          <p className="text-sm text-gray-600">
            All in one action.
          </p>
        </div>
      </div>
    </section>
  );
}
