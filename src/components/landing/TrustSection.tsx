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

          <div>
            <img 
              src="/assets/screenshots/stripe-connected.png" 
              alt="Stripe Connected successfully"
              className="rounded-xl shadow-xl border border-gray-200"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
