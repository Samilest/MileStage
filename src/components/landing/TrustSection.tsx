export default function TrustSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            We Never Touch Your Money
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="space-y-6 text-lg text-gray-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">1</span>
                </div>
                <p>You connect your Stripe account</p>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <p>Clients pay you directly through Stripe</p>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold">3</span>
                </div>
                <p>We track status automatically</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-green-50 rounded-xl border-2 border-green-600">
              <p className="text-xl font-bold text-gray-900 text-center">
                Your money. Your account. Your control.
              </p>
            </div>
          </div>

          <div className="relative">
            <img 
              src="/assets/photos/freelancer-working.jpg" 
              alt="Freelancer working with confidence"
              className="rounded-xl shadow-xl"
            />
            {/* Security badge - smaller, bottom center */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-2xl px-5 py-3 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-base font-semibold text-gray-900">Bank-level security</p>
                  <p className="text-sm text-gray-600">Powered by Stripe • PCI compliant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
