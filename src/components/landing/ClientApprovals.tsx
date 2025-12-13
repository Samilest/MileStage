export default function ClientApprovals() {
  return (
    <section className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        
        {/* Quote Block */}
        <div className="bg-white rounded-2xl p-10 lg:p-12 shadow-sm border border-gray-200 mb-12">
          <div className="flex items-start gap-4 mb-6">
            <svg className="w-12 h-12 text-gray-300 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
            </svg>
          </div>
          <p className="text-xl lg:text-2xl text-gray-700 leading-relaxed mb-6 italic">
            "I have several projects I can't get over the line, due to the client not approving or providing content."
          </p>
          <p className="text-gray-600 font-medium">
            — Web Designer, 20 years experience
          </p>
        </div>

        {/* Solution */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-black mb-4">
            Sound familiar?
          </h2>
          <p className="text-xl text-gray-600">
            MileStage fixes this:
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {[
            "Client can't proceed until they approve & pay",
            'Automated reminders chase approvals',
            'No more projects stuck in limbo',
            'No more chasing for feedback',
          ].map((benefit, index) => (
            <div 
              key={index}
              className="flex items-start gap-4 bg-white rounded-xl p-6 border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-default"
            >
              <svg className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-lg text-gray-700 leading-relaxed">
                {benefit}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom Highlight */}
        <div className="mt-12 text-center">
          <p className="text-2xl font-bold text-black">
            Approve = Pay = Progress
          </p>
          <p className="text-lg text-gray-600 mt-2">
            All in one action.
          </p>
        </div>
      </div>
    </section>
  );
}
