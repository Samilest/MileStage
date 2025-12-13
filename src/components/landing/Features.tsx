import { RefreshCw, Lock, DollarSign } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: RefreshCw,
      title: 'Runs Automatically',
      description: 'Reminders send themselves. No chasing needed.',
    },
    {
      icon: Lock,
      title: 'Stage Locking',
      description: 'Next stage locked until payment clears.',
    },
    {
      icon: DollarSign,
      title: 'Zero Fees',
      description: '$19/month flat. No transaction fees.',
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gray-50">
                  <Icon className="w-8 h-8 text-black" strokeWidth={1.5} />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3">
                  {feature.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
