import { useState } from 'react';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What does MileStage do?",
      answer: "Tracks stage-by-stage payments automatically. Reminders send themselves. Status updates in real-time."
    },
    {
      question: "Do you process payments?",
      answer: "No. You use your Stripe account. We track status only."
    },
    {
      question: "What if my client doesn't use Stripe?",
      answer: "They can pay offline (PayPal, bank transfer, Venmo). You mark it paid manually."
    },
    {
      question: "Do clients need an account?",
      answer: "No. They click a link and see their project. Payment takes 30 seconds."
    },
    {
      question: "Can I try it free?",
      answer: "14 days free. No credit card needed."
    },
    {
      question: "Can I use this with existing clients?",
      answer: "Yes. Import existing projects, set current stage, keep going."
    },
    {
      question: "What happens after the trial?",
      answer: "You'll be prompted to upgrade. No automatic charges. If you don't upgrade, you keep access to existing projects but can't create new ones."
    },
    {
      question: "What if I charge hourly?",
      answer: "MileStage is for project-based work in stages. For hourly, try Harvest or Toggl."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-4 text-left bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 text-sm pr-4">
                  {faq.question}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-500 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-200 ${
                  openIndex === index ? 'max-h-40' : 'max-h-0'
                }`}
              >
                <p className="px-4 pb-4 text-gray-600 text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-2">
            More questions?
          </p>
          <a 
            href="mailto:support@milestage.com" 
            className="text-green-600 hover:text-green-700 font-medium text-sm"
          >
            support@milestage.com
          </a>
        </div>
      </div>
    </section>
  );
}
