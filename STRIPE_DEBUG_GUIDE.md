# Stripe Connect Debugging Guide

## Overview
This document explains the comprehensive debugging that has been added to the Stripe Connect onboarding flow.

## What Was Added

### 1. Frontend Logging (Dashboard Component)
The `handleConnectStripe` function now includes step-by-step console logging:

**Steps logged:**
1. Getting auth session
2. Session obtained with user ID
3. Calling API endpoint (with URL)
4. Response status and headers
5. Parsed response
6. Redirect to Stripe

**Error handling:**
- Auth errors
- API errors with status codes
- Network errors
- Missing URL errors

### 2. Backend Logging (Edge Function)
The `stripe-connect-onboarding` edge function includes detailed logging:

**Steps logged:**
1. Environment variable check (shows if STRIPE_SECRET_KEY exists)
2. Stripe client initialization
3. Supabase client initialization
4. Authentication verification
5. User profile fetch
6. Stripe account creation/retrieval
7. Origin and redirect URL determination
8. Account link creation

## How to Debug

### When User Clicks "Connect Stripe"

**Check Browser Console:**
Look for messages starting with `[Dashboard]`:
```
=== STRIPE CONNECT DEBUG START ===
[Dashboard] Step 1: Getting auth session...
[Dashboard] Step 2: Session obtained successfully
[Dashboard] User ID: xxx
[Dashboard] Step 3: Calling API endpoint: https://xxx.supabase.co/functions/v1/stripe-connect-onboarding
[Dashboard] Step 4: Got response - Status: 200 OK
[Dashboard] Step 5: Parsed response: { url: "https://connect.stripe.com/..." }
[Dashboard] Step 6: Redirecting to Stripe onboarding...
=== STRIPE CONNECT DEBUG END - REDIRECTING ===
```

**Check Supabase Edge Function Logs:**
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Click on `stripe-connect-onboarding`
4. View logs

Look for:
```
=== STRIPE CONNECT ONBOARDING FUNCTION START ===
Step 1: Checking environment variables...
Environment check: { hasStripeKey: true, stripeKeyLength: 107, ... }
Step 2: Initializing Stripe client...
...
=== FUNCTION SUCCESS - RETURNING URL ===
```

## Common Issues and Solutions

### Issue 1: "STRIPE_SECRET_KEY not configured"
**Symptom:** Error message mentions STRIPE_SECRET_KEY
**Solution:**
- Verify STRIPE_SECRET_KEY is set in Supabase project settings
- Check edge function logs to see if key is being read

### Issue 2: "Not authenticated"
**Symptom:** Error after clicking button
**Solution:**
- User needs to log out and log back in
- Check if session is valid

### Issue 3: Network/CORS errors
**Symptom:** Browser console shows network error or CORS error
**Solution:**
- Verify edge function is deployed: `supabase functions list`
- Check if origin is whitelisted in CORS headers
- Verify Supabase URL is correct in .env

### Issue 4: "refused to connect"
**Symptom:** Error about connect.stripe.com refusing connection
**Solution:**
- This should NOT happen anymore - we're doing `window.location.href` redirect
- If it still happens, check browser console for the actual redirect URL
- Verify the URL starts with `https://connect.stripe.com`

## Verifying Setup

### 1. Check Edge Function Deployment
```bash
# List deployed functions
supabase functions list
```

Should show:
- stripe-connect-onboarding (ACTIVE)
- stripe-webhook (ACTIVE)
- create-payment-link (ACTIVE)

### 2. Test API Endpoint
```bash
# Test CORS
curl -X OPTIONS https://YOUR_SUPABASE_URL/functions/v1/stripe-connect-onboarding
```

Should return 200 OK with CORS headers.

### 3. Check Database Fields
Verify `user_profiles` table has these columns:
- stripe_account_id
- stripe_connected_at
- stripe_onboarding_completed
- stripe_charges_enabled
- stripe_payouts_enabled

## Success Flow

1. User clicks "Connect Stripe" button
2. Button shows loading state ("Connecting...")
3. Frontend calls edge function with auth token
4. Edge function creates/retrieves Stripe account
5. Edge function returns Stripe onboarding URL
6. Frontend redirects to Stripe (full page redirect)
7. User completes onboarding on Stripe's site
8. Stripe redirects back to `/dashboard?stripe=success`
9. Dashboard shows success message and updates UI
10. Stripe webhook updates account status in database

## Error Messages

The system now provides user-friendly error messages:

- **"Stripe is not configured on the server"** - STRIPE_SECRET_KEY missing
- **"Please log in again to connect Stripe"** - Auth session expired
- **"Network error. Please check your connection"** - Connection issues
- **"Failed to connect Stripe: [specific error]"** - Other errors

## Support Information

If issues persist after checking logs:
1. Copy all console logs from browser
2. Copy edge function logs from Supabase
3. Note the exact error message shown to user
4. Verify STRIPE_SECRET_KEY is configured in Supabase
