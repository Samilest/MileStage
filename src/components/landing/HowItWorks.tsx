export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Create Project',
      description: 'Pick template, set stages. Takes 3 minutes.',
    },
    {
      number: '02',
      title: 'Client Pays Stage-by-Stage',
      description: 'Stage 0: Deposit → Stage 1: Concepts → Stage 2: Revisions',
    },
    {
      number: '03',
      title: 'Track Automatically',
      description: 'Status updates in real-time. Reminders send themselves.',
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl lg:text-5xl font-bold text-black text-center mb-20">
          How It Works
        </h2>

        <div className="space-y-16">
          {steps.map((step, index) => (
            <div key={index} className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="text-7xl font-bold text-gray-200 leading-none">
                  {step.number}
                </div>
              </div>
              <div className="flex-1 pt-2">
                <h3 className="text-2xl lg:text-3xl font-bold text-black mb-3">
                  {step.title}
                </h3>
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
