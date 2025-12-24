import { Helmet } from 'react-helmet-async';

export default function SEOHead() {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>MileStage - Stage-by-Stage Payment Tracking for Freelancers</title>
      <meta 
        name="title" 
        content="MileStage - Stage-by-Stage Payment Tracking for Freelancers" 
      />
      <meta 
        name="description" 
        content="Stop scope creep and get paid on time. MileStage tracks milestone payments automatically, locks stages until paid, and sends reminders. Zero transaction fees. 14-day free trial." 
      />
      
      {/* Keywords for SEO */}
      <meta 
        name="keywords" 
        content="milestone payment tracking, freelance payment software, stage-based invoicing, scope creep prevention, freelancer payment tool, project milestone billing, payment tracking software" 
      />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://milestage.com/" />
      <meta property="og:title" content="MileStage - Stage-by-Stage Payment Tracking for Freelancers" />
      <meta 
        property="og:description" 
        content="Stop scope creep and get paid on time. Track milestone payments automatically. Zero transaction fees." 
      />
      <meta property="og:image" content="https://milestage.com/assets/og-image.png" />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content="https://milestage.com/" />
      <meta property="twitter:title" content="MileStage - Stage-by-Stage Payment Tracking for Freelancers" />
      <meta 
        property="twitter:description" 
        content="Stop scope creep and get paid on time. Track milestone payments automatically. Zero transaction fees." 
      />
      <meta property="twitter:image" content="https://milestage.com/assets/og-image.png" />

      {/* Favicon */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      
      {/* Theme Color */}
      <meta name="theme-color" content="#10B981" />
      
      {/* Canonical URL */}
      <link rel="canonical" href="https://milestage.com/" />
    </Helmet>
  );
}
