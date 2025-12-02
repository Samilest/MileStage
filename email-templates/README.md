# 📧 MILESTAGE EMAIL TEMPLATES

## Overview
Complete set of professional, brand-consistent email templates for MileStage.

**Design Principles:**
- ✅ Modern, clean layout
- ✅ MileStage branding (Black, White, Green #10B981)
- ✅ Typography: Plus Jakarta Sans
- ✅ Professional & friendly tone
- ✅ Dead simple hierarchy
- ✅ Mobile-responsive
- ✅ Buttons link to client portal (not direct Stripe)
- ✅ Logo positioned on left side of header
- ✅ Pure white button text

---

## 📁 Templates Included

### 1. Work Delivered (`1-work-delivered.html`)
**When to send:** Freelancer delivers work, client needs to review
**Icon:** 📋
**CTA:** "Review Work →"
**Variables:**
- `{{client_name}}` - Client's first name
- `{{stage_name}}` - Stage name (e.g., "Discovery & Research")
- `{{project_name}}` - Project name
- `{{amount}}` - Stage amount (e.g., "$800")
- `{{portal_url}}` - Link to client portal
- `{{freelancer_name}}` - Freelancer's name
- `{{freelancer_email}}` - Freelancer's email

---

### 2. Payment Reminder (`2-payment-reminder.html`)
**When to send:** Automated reminder when payment is overdue
**Icon:** 💳
**CTA:** "Make Payment →"
**Variables:**
- `{{client_name}}` - Client's first name
- `{{stage_name}}` - Stage name
- `{{due_date}}` - Original due date (formatted)
- `{{days_overdue}}` - Number of days overdue (optional)
- `{{project_name}}` - Project name
- `{{amount}}` - Amount due
- `{{portal_url}}` - Link to client portal
- `{{freelancer_name}}` - Freelancer's name
- `{{freelancer_email}}` - Freelancer's email

**Note:** `{{days_overdue}}` is optional - only show yellow alert box if payment is overdue

---

### 3. Payment Confirmation (`3-payment-confirmation.html`)
**When to send:** After successful payment
**Icon:** ✅
**CTA:** "View Project Status →"
**Variables:**
- `{{client_name}}` - Client's first name
- `{{stage_name}}` - Stage name
- `{{project_name}}` - Project name
- `{{payment_date}}` - Date payment received (formatted)
- `{{payment_method}}` - Payment method (e.g., "Visa ending in 4242")
- `{{amount}}` - Amount paid
- `{{next_stage}}` - Next stage name (optional - if null, show "project complete")
- `{{portal_url}}` - Link to client portal
- `{{freelancer_name}}` - Freelancer's name
- `{{freelancer_email}}` - Freelancer's email

---

### 4. Welcome Email (`4-welcome-email.html`)
**When to send:** New freelancer signs up
**Icon:** 🎉
**CTA:** "Go to Dashboard →"
**Variables:**
- `{{freelancer_name}}` - Freelancer's name

**Note:** This email has minimal variables since it's a general onboarding email

---

### 5. Stage Approved (`5-stage-approved.html`)
**When to send:** Client approves work, payment now due
**Icon:** ✅
**CTA:** "Make Payment →"
**Variables:**
- `{{client_name}}` - Client's first name
- `{{stage_name}}` - Stage name
- `{{project_name}}` - Project name
- `{{approval_date}}` - Date client approved (formatted)
- `{{due_date}}` - Payment due date
- `{{amount}}` - Amount due
- `{{next_stage}}` - Next stage name (optional)
- `{{portal_url}}` - Link to client portal
- `{{freelancer_name}}` - Freelancer's name
- `{{freelancer_email}}` - Freelancer's email

---

### 6. Final Overdue Notice (`6-final-overdue-notice.html`)
**When to send:** Last automated reminder before manual follow-up
**Icon:** ⚠️
**CTA:** "Make Payment Now →"
**Variables:**
- `{{client_name}}` - Client's first name
- `{{stage_name}}` - Stage name
- `{{project_name}}` - Project name
- `{{due_date}}` - Original due date
- `{{days_overdue}}` - Number of days overdue
- `{{amount}}` - Amount due
- `{{portal_url}}` - Link to client portal
- `{{freelancer_name}}` - Freelancer's name
- `{{freelancer_email}}` - Freelancer's email
- `{{freelancer_phone}}` - Freelancer's phone (optional)

---

## 🔧 Implementation Guide

### Step 1: Upload Logo
Upload MileStage logo to:
```
https://milestage.com/assets/milestage-logo.png
```
Or update all templates to use your CDN URL.

**Logo specs:**
- Format: PNG with transparent background
- Size: Height 40-48px
- White version (for green header)

---

### Step 2: Set Up Email Service (Resend)

Install Resend:
```bash
npm install resend
```

Create API route: `api/email/send.js`
```javascript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  const { to, subject, html, replyTo } = req.body;

  try {
    const data = await resend.emails.send({
      from: 'MileStage <notifications@milestage.com>',
      to: to,
      subject: subject,
      html: html,
      replyTo: replyTo, // Freelancer's email
    });

    res.status(200).json({ success: true, id: data.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}
```

---

### Step 3: Create Email Sending Function

Create: `lib/sendEmail.js`
```javascript
import fs from 'fs';
import path from 'path';

export async function sendEmail(template, variables, to, subject, replyTo) {
  // Load template
  const templatePath = path.join(process.cwd(), 'email-templates', `${template}.html`);
  let html = fs.readFileSync(templatePath, 'utf-8');

  // Replace variables
  Object.keys(variables).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, variables[key] || '');
  });

  // Handle conditional blocks ({{#if}})
  html = html.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, key, content) => {
    return variables[key] ? content : '';
  });

  // Send email
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html, replyTo }),
  });

  return response.json();
}
```

---

### Step 4: Usage Examples

#### Send Work Delivered Email
```javascript
import { sendEmail } from '../lib/sendEmail';

await sendEmail(
  '1-work-delivered',
  {
    client_name: 'Sam',
    stage_name: 'Discovery & Research',
    project_name: 'Hat Logo',
    amount: '$800',
    portal_url: 'https://milestage.com/client/ST-ABC123',
    freelancer_name: 'Jane Designer',
    freelancer_email: 'jane@example.com',
  },
  'sam@client.com',
  'Work Ready for Review - Hat Logo',
  'jane@example.com'
);
```

#### Send Payment Reminder
```javascript
await sendEmail(
  '2-payment-reminder',
  {
    client_name: 'Sam',
    stage_name: 'Discovery & Research',
    project_name: 'Hat Logo',
    due_date: 'November 20, 2025',
    days_overdue: 3, // Optional - only if overdue
    amount: '$800',
    portal_url: 'https://milestage.com/client/ST-ABC123',
    freelancer_name: 'Jane Designer',
    freelancer_email: 'jane@example.com',
  },
  'sam@client.com',
  'Payment Reminder - Hat Logo',
  'jane@example.com'
);
```

#### Send Payment Confirmation
```javascript
await sendEmail(
  '3-payment-confirmation',
  {
    client_name: 'Sam',
    stage_name: 'Discovery & Research',
    project_name: 'Hat Logo',
    payment_date: 'November 27, 2025',
    payment_method: 'Visa ending in 4242',
    amount: '$800',
    next_stage: 'Concept Development', // Or null if final stage
    portal_url: 'https://milestage.com/client/ST-ABC123',
    freelancer_name: 'Jane Designer',
    freelancer_email: 'jane@example.com',
  },
  'sam@client.com',
  'Payment Confirmed - Hat Logo',
  'jane@example.com'
);
```

#### Send Welcome Email
```javascript
await sendEmail(
  '4-welcome-email',
  {
    freelancer_name: 'Jane',
  },
  'jane@example.com',
  'Welcome to MileStage! 🎉',
  'support@milestage.com'
);
```

---

## 📋 Variable Format Guide

### Names
- Use first name only (friendly tone)
- Example: "Sam" not "Sam Johnson"

### Amounts
- Include currency symbol
- Format: "$1,234.56"
- Example: `{{amount}}` = "$800"

### Dates
- Format: "Month Day, Year"
- Example: "November 27, 2025"

### Portal URLs
- Always full URL with https://
- Example: "https://milestage.com/client/ST-ABC123"

### Payment Methods
- Format: "Card Type ending in XXXX"
- Example: "Visa ending in 4242"

### Optional Variables
Use conditional rendering:
```html
{{#if days_overdue}}
  <div>{{days_overdue}} days overdue</div>
{{/if}}
```

---

## 🎨 Customization Guide

### Change Brand Color
Find and replace `#10B981` with your color:
```css
background-color: #10B981;
border-left: 4px solid #10B981;
color: #10B981;
```

### Change Font
Replace font stack:
```css
font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Change Button Text
Find button sections and update text:
```html
<a href="{{portal_url}}" style="...">
  Make Payment →
</a>
```

---

## ✅ Testing Checklist

Before deploying:
- [ ] Test all templates render correctly
- [ ] Verify logo displays (check URL)
- [ ] Test variable replacement works
- [ ] Check button colors (white text on green)
- [ ] Test on mobile devices
- [ ] Verify sender name shows: "Freelancer Name (via MileStage)"
- [ ] Test reply-to goes to freelancer's email
- [ ] Check all links work (portal URLs)
- [ ] Test conditional blocks ({{#if}})

---

## 📱 Mobile Optimization

All templates are mobile-responsive with:
- Single column layout on mobile
- Touch-friendly button sizes (min 44px height)
- Readable font sizes (min 14px)
- Proper padding and spacing
- Tables for email client compatibility

---

## 🚀 Deployment

1. **Copy templates** to your project:
   ```
   /email-templates/
     1-work-delivered.html
     2-payment-reminder.html
     3-payment-confirmation.html
     4-welcome-email.html
     5-stage-approved.html
     6-final-overdue-notice.html
   ```

2. **Update logo URL** in all templates

3. **Set up Resend**:
   - Sign up at resend.com
   - Verify domain: milestage.com
   - Add API key to env: `RESEND_API_KEY`

4. **Test sending**:
   - Send test email to yourself
   - Check rendering in Gmail, Outlook, Apple Mail
   - Verify mobile display

5. **Integrate with app**:
   - Call sendEmail() when work delivered
   - Set up cron job for payment reminders
   - Trigger on payment confirmation
   - Send welcome email on signup

---

## 💡 Tips

- **Subject lines**: Keep under 50 characters for mobile
- **Preview text**: First ~100 characters show in inbox preview
- **Testing**: Use tools like Litmus or Email on Acid
- **Spam filters**: Avoid ALL CAPS, excessive punctuation
- **Unsubscribe**: Add if sending marketing emails (not needed for transactional)

---

## 🆘 Support

Questions? Email: support@milestage.com
Documentation: https://milestage.com/docs

---

**Created:** December 2025
**Version:** 1.0
**License:** Proprietary - MileStage
