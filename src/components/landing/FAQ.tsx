export default function FAQ() {
  const faqs = [
    {
      question: 'What does MileStage do?',
      answer: 'Tracks stage-by-stage payments automatically. Reminders send themselves. Status updates in real-time.',
    },
    {
      question: 'Do you process payments?',
      answer: 'No. You use your Stripe account. We track status only.',
    },
    {
      question: "What if I don't use Stripe?",
      answer: 'Mark payments manually when they come in via bank transfer, PayPal, etc.',
    },
    {
      question: 'Can I try it free?',
      answer: '14 days free. No credit card needed. Full refund if not happy after paying.',
    },
    {
      question: 'How is the refund policy?',
      answer: 'We offer a 30-day full refund for first-time customers, but renewals and upgrades are non-refundable. If you cancel after 30 days, you can still use your plan until the end of the month you already paid for.',
    },
    {
      question: 'What if I charge hourly?',
      answer: 'MileStage is for project-based work in stages. For hourly, try Harvest or Toggl.',
    },
  ];

  return (
    <section id="faq" className="py-24 lg:py-32 bg-white scroll-mt-20">
      <div className="max-w-4xl mx-auto px-6 lg:px-12">
        <h2 className="text-4xl lg:text-5xl font-bold text-black text-center mb-20">
          Questions
        </h2>

        <div className="space-y-10">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className="pb-10 border-b border-gray-200 last:border-0 last:pb-0 group transition-all duration-300 hover:translate-x-2"
            >
              <h3 className="text-2xl font-bold text-black mb-4 group-hover:text-green-600 transition-colors duration-300">
                {faq.question}
              </h3>
              <p className="text-lg lg:text-xl text-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
