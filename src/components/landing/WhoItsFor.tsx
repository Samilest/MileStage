export default function WhoItsFor() {
  const audiences = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      title: 'Designers',
      subtitle: 'Logos, branding, print',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
      title: 'Developers',
      subtitle: 'Websites, apps, code',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Creators',
      subtitle: 'Video, photo, writing',
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Consultants',
      subtitle: 'Any milestone work',
    },
  ];

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* FIXED: Better mobile text wrapping */}
        <h2 className="text-center text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          Built for Freelancers Who Work in Stages
        </h2>
        
        <p className="text-center text-sm sm:text-base text-gray-600 mb-10 max-w-2xl mx-auto">
          For designers, developers, and creators who work in stages
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          {audiences.map((item, index) => (
            <div key={index} className="text-center group">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-white group-hover:bg-green-600 transition-colors duration-200">
                {item.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{item.title}</h3>
              <p className="text-xs sm:text-sm text-gray-500">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
