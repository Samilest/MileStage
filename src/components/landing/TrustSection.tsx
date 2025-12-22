export default function TrustSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            We Never Touch Your Money
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            You use your own Stripe account. Payments go directly to you. We just track status.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-12">
          <div>
            <div className="space-y-8 text-lg text-gray-700">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">1</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">You connect your Stripe account</p>
                  <p className="text-gray-600 text-base">Free to set up. Takes 5 minutes.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">2</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Clients pay you directly through Stripe</p>
                  <p className="text-gray-600 text-base">Money goes straight to your bank. We never hold funds.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">3</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">We track status automatically</p>
                  <p className="text-gray-600 text-base">Payment received? Stage unlocks. That's it.</p>
                </div>
              </div>
            </div>

            <div className="mt-10 p-6 bg-green-50 rounded-xl border-2 border-green-600">
              <p className="text-2xl font-bold text-gray-900 text-center">
                Your money. Your account. Your control.
              </p>
            </div>
          </div>

          <div className="relative">
            {/* Human photo */}
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <img 
                src="/assets/photos/freelancer-working.jpg" 
                alt="Freelancer working confidently"
                className="w-full h-[500px] object-cover"
              />
            </div>

            {/* Trust badge overlay */}
            <div className="absolute bottom-8 left-8 right-8 bg-white/95 backdrop-blur-sm rounded-xl p-6 shadow-xl border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <svg className="w-12 h-12 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Bank-level security</p>
                  <p className="text-sm text-gray-600">Powered by Stripe • PCI compliant</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom stat */}
        <div className="text-center max-w-2xl mx-auto">
          <p className="text-gray-600">
            Prefer offline payments? No problem. Clients can pay via PayPal, bank transfer, or any method you choose—just mark it paid manually in the dashboard.
          </p>
        </div>
      </div>
    </section>
  );
}
