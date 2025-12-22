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
      answer: "They can pay offline (PayPal, bank transfer, Venmo). You mark it paid manually. Stripe is optional but recommended."
    },
    {
      question: "Do clients need an account?",
      answer: "No. They just click a link and see their project. Payment takes 30 seconds."
    },
    {
      question: "Can I try it free?",
      answer: "14 days free. No credit card needed. Full refund if not happy after paying."
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
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Questions
          </h2>
        </div>

        <div className="space-y-8">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            More questions?
          </p>
          <a 
            href="mailto:support@milestage.com" 
            className="text-green-600 hover:text-green-700 font-medium"
          >
            support@milestage.com
          </a>
        </div>
      </div>
    </section>
  );
}
