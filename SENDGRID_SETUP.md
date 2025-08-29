# SendGrid Email Configuration Guide

## 🔧 Setup Status
- ✅ Code implementation complete
- ⚠️ API key needed from SendGrid
- ✅ Email templates configured

## 📋 Steps to Complete Setup

### 1. Get SendGrid API Key
1. Go to [SendGrid](https://sendgrid.com)
2. Sign up or log in to your account
3. Navigate to Settings → API Keys
4. Create a new API key with "Full Access"
5. Copy the API key (it starts with `SG.`)

### 2. Configure Sender Authentication
1. In SendGrid, go to Settings → Sender Authentication
2. Verify your domain (kctmenswear.com) or single sender email
3. Follow SendGrid's domain verification process
4. Make sure `noreply@kctmenswear.com` is verified

### 3. Update Environment Variables
Replace the placeholder in `.env.local`:
```
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=noreply@kctmenswear.com  # Must be verified in SendGrid
ADMIN_EMAIL=KCTMenswear@gmail.com  # Where to receive contact form submissions
```

### 4. Test Email Functionality
```bash
# Test the contact form
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","message":"Test message"}'

# Test newsletter signup
curl -X POST http://localhost:3000/api/newsletter \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 📧 Email Features Implemented

### 1. Contact Form (`/api/contact`)
- Sends email to admin when contact form is submitted
- Sends confirmation email to user
- Includes formatted HTML and plain text versions

### 2. Newsletter Signup (`/api/newsletter`)
- Sends welcome email with 10% discount code
- Notifies admin of new subscriber
- Professional HTML template

### 3. Order Confirmation (`/api/email/order-confirmation`)
- Detailed order summary with items, prices, totals
- Shipping address confirmation
- Professional invoice-style layout

## 🎨 Email Templates
All emails use:
- KCT brand colors (black #000, gold #D4AF37)
- Professional HTML formatting
- Mobile-responsive design
- Plain text fallbacks

## 🔍 Troubleshooting

### If emails aren't sending:
1. Check API key is valid and has proper permissions
2. Verify sender email is authenticated in SendGrid
3. Check SendGrid dashboard for bounced/blocked emails
4. Review error logs in Vercel Functions tab

### Common Issues:
- **401 Error**: Invalid API key
- **403 Error**: Sender not verified
- **400 Error**: Invalid email format or missing required fields

## 📊 SendGrid Features to Consider
- **Email Analytics**: Track open rates, click rates
- **Templates**: Create reusable templates in SendGrid
- **Webhooks**: Get notifications for email events
- **Suppression Management**: Handle unsubscribes automatically

## 🚀 Production Checklist
- [ ] Add real SendGrid API key to Vercel environment variables
- [ ] Verify domain in SendGrid
- [ ] Test all email endpoints
- [ ] Set up email analytics tracking
- [ ] Configure bounce/complaint handling
- [ ] Add unsubscribe links to marketing emails