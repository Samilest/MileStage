export default function FAQ() {
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

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Questions
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="bg-gray-50 rounded-lg p-5 border border-gray-100"
            >
              <h3 className="font-semibold text-gray-900 mb-2 text-sm">
                {faq.question}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {faq.answer}
              </p>
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
