import { RefreshCw, Lock, DollarSign } from 'lucide-react';

export default function Features() {
  const features = [
    {
      icon: RefreshCw,
      title: 'Runs Automatically',
      description: 'Payment reminders and revision tracking happen in the background. Zero effort required.',
    },
    {
      icon: Lock,
      title: 'Stage Locking + Revision Limits',
      description: 'Next stage locked until payment clears. Revision limits enforced to prevent scope creep.',
    },
    {
      icon: DollarSign,
      title: 'Zero Fees',
      description: '$19/month flat. No transaction fees. You keep 100% of what clients pay.',
    },
  ];

  return (
    <section className="py-24 lg:py-32 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index} 
                className="text-center group cursor-default transition-all duration-300 hover:-translate-y-2"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gray-50 group-hover:bg-green-50 transition-all duration-300 group-hover:shadow-md">
                  <Icon className="w-8 h-8 text-black group-hover:text-green-600 transition-all duration-300 group-hover:scale-110" strokeWidth={1.5} />
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
