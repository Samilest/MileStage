import { Helmet } from 'react-helmet-async';

export default function StructuredData() {
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "MileStage",
    "applicationCategory": "BusinessApplication",
    "applicationSubCategory": "Payment Tracking Software",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "19",
      "priceCurrency": "USD",
      "priceValidUntil": "2026-12-31"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5",
      "ratingCount": "1"
    },
    "featureList": [
      "Stage-by-stage payment tracking",
      "Automated payment reminders",
      "Stage locking system",
      "Zero transaction fees",
      "Client portal (no signup required)",
      "Multi-currency support",
      "Real-time payment status updates",
      "Scope creep prevention"
    ],
    "audience": {
      "@type": "Audience",
      "audienceType": "Freelancers, Consultants, Agencies"
    },
    "description": "MileStage helps freelancers track stage-by-stage payments automatically. Prevent scope creep with automated stage locking and payment reminders. Zero transaction fees.",
    "url": "https://milestage.com",
    "screenshot": "https://milestage.com/assets/screenshots/hero-dashboard.png"
  };

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "MileStage",
    "url": "https://milestage.com",
    "logo": "https://milestage.com/assets/milestage-logo.png",
    "sameAs": [
      "https://www.linkedin.com/company/milestage",
      "https://twitter.com/milestage"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "Customer Support",
      "email": "support@milestage.com"
    }
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What does MileStage do?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "MileStage tracks stage-by-stage payments automatically. Reminders send themselves. Status updates in real-time."
        }
      },
      {
        "@type": "Question",
        "name": "Do you process payments?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "No. You use your Stripe account. We track status only."
        }
      },
      {
        "@type": "Question",
        "name": "Can I try it free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "14 days free. No credit card needed. Full refund if not happy after paying."
        }
      }
    ]
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(softwareSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(faqSchema)}
      </script>
    </Helmet>
  );
}
