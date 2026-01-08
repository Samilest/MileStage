export default function TrustSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">
              We Never Touch Your Money
            </h2>

            <div className="space-y-6">
              {[
                { step: '1', text: 'You connect your Stripe account' },
                { step: '2', text: 'Clients pay you directly through Stripe' },
                { step: '3', text: 'We track status automatically' },
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-700 text-sm font-semibold">{item.step}</span>
                  </div>
                  <p className="text-gray-700 pt-1">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 p-5 bg-green-50 rounded-xl border border-green-200">
              <p className="text-lg font-semibold text-gray-900 text-center">
                Your money. Your account. Your control.
              </p>
            </div>
          </div>

          {/* Image with badge */}
          <div className="relative">
            <div className="rounded-xl shadow-xl overflow-hidden">
              <img 
                src="/assets/photos/freelancer-working.jpg" 
                alt="Freelancer working with confidence"
                className="w-full object-cover"
              />
            </div>
            
            {/* Security badge */}
            <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-6 bg-white rounded-lg shadow-xl px-4 py-3 border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Bank-level security</p>
                  <p className="text-xs text-gray-500">Powered by Stripe</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
