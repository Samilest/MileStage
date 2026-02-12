import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slides = [
    {
      src: '/assets/screenshots/hero-dashboard.gif',
      alt: 'MileStage Dashboard Overview',
    },
    {
      src: '/assets/screenshots/step1-create-project.png',
      alt: 'Create Project with Templates',
    },
    {
      src: '/assets/screenshots/step2-stages.png',
      alt: 'Stage-based Payment Tracking',
    },
    {
      src: '/assets/screenshots/step3-client-portal.png',
      alt: 'Professional Client Portal',
    },
  ];

  // Auto-advance slides
  useEffect(() => {
    if (isPaused) return;
    
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(timer);
  }, [isPaused, slides.length]);

  return (
    <section className="relative bg-white pt-24 pb-16 sm:pt-32 sm:pb-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Centered Content */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight mb-6">
            <span className="block leading-tight">Stop Scope Creep.</span>
            <span className="block text-green-600 leading-tight mt-3">Get Paid Per Stage.</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl mx-auto">
            Clients can't push for "one more tweak" when the next stage is locked until payment clears.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center px-8 py-4 bg-green-600 text-white text-base font-semibold rounded-lg hover:bg-green-700 transition-all duration-200 shadow-lg shadow-green-600/25 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5"
            >
              Try Free for 14 Days
              <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            No credit card required • Cancel anytime
          </p>
        </div>

        {/* Dashboard Screenshot Slider */}
        <div className="relative max-w-5xl mx-auto">
          <div 
            className="relative rounded-xl shadow-2xl border border-gray-200 overflow-hidden bg-gray-100"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Slides */}
            <div className="relative">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`transition-opacity duration-500 ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 absolute inset-0'
                  }`}
                >
                  <img 
                    src={slide.src} 
                    alt={slide.alt}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Slide Indicators - in clear container below image */}
          </div>
          
          {/* Dots below slider in subtle container */}
          <div className="flex justify-center mt-4">
            <div className="bg-gray-100 rounded-full px-4 py-2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index);
                    setIsPaused(true);
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide 
                      ? 'bg-green-600 w-6' 
                      : 'bg-gray-400 hover:bg-gray-600'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Simple inline badges */}
          <div className="flex justify-center items-center gap-6 mt-6 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Multi-currency (USD, EUR, GBP)
            </span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              $0 transaction fees
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
