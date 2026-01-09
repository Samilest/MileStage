export default function Testimonial() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          {/* Quote mark */}
          <div className="absolute -top-4 -left-2 text-green-100 text-8xl font-serif leading-none select-none">
            "
          </div>
          
          <blockquote className="relative z-10 text-center">
            <p className="text-xl sm:text-2xl text-gray-900 font-medium leading-relaxed mb-6">
              I used to spend hours chasing invoices and negotiating scope changes. 
              Now I just send a MileStage link and the system handles everything. 
              <span className="text-green-600"> Game changer for my sanity.</span>
            </p>
            
            <footer className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold text-lg">
                SC
              </div>
              <div className="text-left">
                <p className="font-semibold text-gray-900">Sarah Chen</p>
                <p className="text-sm text-gray-500">Brand Designer, 8 years freelancing</p>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
