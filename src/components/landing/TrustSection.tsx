export default function TrustSection() {
  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-3xl mx-auto px-6 lg:px-12 text-center">
        <div className="inline-block mb-6">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-4xl lg:text-5xl font-bold text-black mb-8">
          We Never Touch Your Money
        </h2>
        
        <div className="space-y-4 text-xl lg:text-2xl text-gray-700 mb-10">
          <p>You connect your Stripe account.</p>
          <p>Clients pay you directly.</p>
          <p>We track status automatically.</p>
        </div>

        <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 inline-block">
          <p className="text-2xl text-black font-bold">
            Your money. Your account. Your control.
          </p>
        </div>
      </div>
    </section>
  );
}
