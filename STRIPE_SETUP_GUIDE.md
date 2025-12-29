# Stripe Setup Guide for Backend

This guide will walk you through creating a Stripe account and configuring it for your backend application to process payments.

## Prerequisites
- An email address
- A business or personal account (Stripe accepts both)

## Step 1: Create a Stripe Account

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com/register
   - Click "Create account"

2. **Enter Your Details**
   - Email address
   - Full name
   - Password
   - Country (where your business is located)
   - Click "Create account"

3. **Verify Your Email**
   - Check your email inbox
   - Click the verification link from Stripe

4. **Complete Account Setup**
   - Add business information (can be updated later)
   - Add business type (Individual, Company, etc.)
   - Add business address
   - Add phone number
   - Click "Continue"

## Step 2: Activate Your Account (For Production)

**For Testing (Development):**
- You can use test mode immediately - no activation needed
- Test mode is perfect for development and testing

**For Production:**
- Complete business verification
- Add bank account details for payouts
- Verify business information
- This may take 1-2 business days

## Step 3: Get Your API Keys

### Test Mode Keys (For Development)

1. **Make sure you're in Test Mode**
   - Look for "Test mode" toggle in the top right of Stripe Dashboard
   - It should be ON (toggle should show "Test mode")

2. **Navigate to API Keys**
   - Click "Developers" in the left sidebar
   - Click "API keys" under "Developers"

3. **Copy Your Test Keys**
   - **Secret key** (starts with `sk_test_`)
     - Click "Reveal test key" to see the full key
     - Copy this key - you'll need it for `STRIPE_SECRET_KEY`
   - **Publishable key** (starts with `pk_test_`)
     - Not needed for backend, but useful for frontend

### Production Keys (For Live Payments)

1. **Switch to Live Mode**
   - Toggle "Test mode" to OFF in the top right
   - You'll see "Live mode" instead

2. **Navigate to API Keys**
   - Click "Developers" → "API keys"

3. **Copy Your Live Keys**
   - **Secret key** (starts with `sk_live_`)
     - Click "Reveal live key" to see the full key
     - Copy this key - you'll need it for `STRIPE_SECRET_KEY`
   - **Publishable key** (starts with `pk_live_`)
     - Not needed for backend

⚠️ **IMPORTANT**: 
- Never share your secret keys publicly
- Never commit secret keys to Git
- Use test keys for development
- Use live keys only in production

## Step 4: Set Up Webhooks

Webhooks allow Stripe to notify your backend about payment events (successful payments, failures, etc.).

### For Local Development (Using Stripe CLI)

1. **Install Stripe CLI**
   - **Windows**: Download from https://github.com/stripe/stripe-cli/releases
   - **Mac**: `brew install stripe/stripe-cli/stripe`
   - **Linux**: See https://stripe.com/docs/stripe-cli

2. **Login to Stripe CLI**
   ```bash
   stripe login
   ```
   - This will open a browser to authenticate

3. **Forward Webhooks to Local Server**
   ```bash
   stripe listen --forward-to localhost:3000/webhook
   ```
   - Replace `3000` with your backend port if different
   - This will output a webhook signing secret (starts with `whsec_`)
   - Copy this secret for `STRIPE_WEBHOOK_SECRET`

### For Production (Stripe Dashboard)

1. **Go to Webhooks**
   - Click "Developers" in left sidebar
   - Click "Webhooks"

2. **Add Endpoint**
   - Click "Add endpoint"
   - Enter your webhook URL: `https://yourdomain.com/webhook`
   - Select events to listen to (or select "Select all events")
   - Click "Add endpoint"

3. **Get Webhook Signing Secret**
   - Click on your newly created webhook endpoint
   - Click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)
   - This is your `STRIPE_WEBHOOK_SECRET`

### Recommended Webhook Events

Your backend should listen to these events:
- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `charge.succeeded` - Charge completed
- `charge.failed` - Charge failed
- `customer.created` - New customer created
- `customer.updated` - Customer updated

## Step 5: Configure Environment Variables

1. **Locate your `.env` file** in the backend root directory
   - If it doesn't exist, copy from `env.example`:
     ```bash
     cp env.example .env
     ```

2. **Add Stripe credentials to `.env` file**

   **For Development (Test Mode):**
   ```env
   # STRIPE CONFIGURATION (Test Mode)
   STRIPE_SECRET_KEY=sk_test_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqrstuvwxyz
   STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
   ```

   **For Production (Live Mode):**
   ```env
   # STRIPE CONFIGURATION (Production)
   STRIPE_SECRET_KEY=sk_live_51AbCdEfGhIjKlMnOpQrStUvWxYz1234567890abcdefghijklmnopqrstuvwxyz
   STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdefghijklmnopqrstuvwxyz
   ```

3. **Important Notes:**
   - Use test keys (`sk_test_`) for development
   - Use live keys (`sk_live_`) only in production
   - Never commit `.env` file to Git
   - Keep your secret keys secure

## Step 6: Verify Configuration

1. **Test your backend startup**
   ```bash
   npm start
   ```

2. **Look for successful initialization**
   - No errors about missing Stripe keys
   - Backend should start normally

3. **Test a Payment (Test Mode)**
   - Use Stripe test card numbers:
     - Success: `4242 4242 4242 4242`
     - Decline: `4000 0000 0000 0002`
     - 3D Secure: `4000 0025 0000 3155`
   - Use any future expiry date (e.g., 12/25)
   - Use any 3-digit CVC (e.g., 123)
   - Use any ZIP code (e.g., 12345)

## Step 7: Understanding Test vs Live Mode

### Test Mode
- ✅ No real charges
- ✅ Use test card numbers
- ✅ Perfect for development
- ✅ Test all scenarios (success, failure, etc.)
- ✅ Keys start with `sk_test_` and `pk_test_`

### Live Mode
- ⚠️ Real charges to real cards
- ⚠️ Real money transactions
- ⚠️ Only use in production
- ⚠️ Keys start with `sk_live_` and `pk_live_`

**Always test thoroughly in Test Mode before going live!**

## Troubleshooting

### Error: "STRIPE_SECRET_KEY is not set"
- Make sure your `.env` file exists and contains `STRIPE_SECRET_KEY`
- Check that the variable name is exactly `STRIPE_SECRET_KEY` (case-sensitive)
- Verify the key starts with `sk_test_` (test) or `sk_live_` (production)

### Error: "Invalid API Key"
- Verify you copied the entire key (they're long!)
- Check for extra spaces before/after the key
- Ensure you're using the correct mode (test vs live)
- Make sure the key hasn't been revoked in Stripe Dashboard

### Webhook Not Working
- Verify `STRIPE_WEBHOOK_SECRET` is set correctly
- Check that your webhook endpoint URL is correct
- Ensure your server is accessible from the internet (for production)
- For local development, use Stripe CLI: `stripe listen --forward-to localhost:3000/webhook`
- Check webhook logs in Stripe Dashboard → Developers → Webhooks

### Payment Fails in Test Mode
- Make sure you're using test card numbers (not real cards)
- Verify you're in Test Mode in Stripe Dashboard
- Check that you're using test API keys (`sk_test_`)

### "No such payment_intent" Error
- Verify the payment intent ID exists in your Stripe Dashboard
- Check that you're using the correct mode (test vs live)
- Ensure the payment intent belongs to your account

## Security Best Practices

1. **Never commit `.env` file to Git**
   - It should already be in `.gitignore`
   - Double-check that your `.env` file is not tracked

2. **Rotate keys if exposed**
   - If a key is accidentally committed or shared, rotate it immediately
   - Go to Stripe Dashboard → Developers → API keys
   - Click "Roll key" to generate a new one

3. **Use different keys for different environments**
   - Development: Test keys (`sk_test_`)
   - Staging: Test keys (`sk_test_`)
   - Production: Live keys (`sk_live_`)

4. **Restrict API key permissions**
   - In Stripe Dashboard, you can restrict what each key can do
   - Use least privilege principle

5. **Monitor your Stripe Dashboard**
   - Regularly check for suspicious activity
   - Set up email alerts for important events
   - Review failed payments and disputes

## Quick Reference: Required Environment Variables

| Variable | Required | Description | Example |
|---------|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | ✅ Yes | Your Stripe secret API key | `sk_test_51...` or `sk_live_51...` |
| `STRIPE_WEBHOOK_SECRET` | ✅ Yes | Webhook signing secret | `whsec_123...` |

## Stripe Dashboard Quick Links

- **Dashboard**: https://dashboard.stripe.com/
- **API Keys**: https://dashboard.stripe.com/apikeys
- **Webhooks**: https://dashboard.stripe.com/webhooks
- **Test Cards**: https://stripe.com/docs/testing
- **Documentation**: https://stripe.com/docs/api
- **Logs**: https://dashboard.stripe.com/logs

## Additional Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Security Best Practices](https://stripe.com/docs/security)

## Test Card Numbers

Use these in Test Mode to simulate different scenarios:

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0000 0000 0002` | Card declined |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0000 0000 3220` | 3D Secure authentication required |

**Expiry**: Any future date (e.g., 12/25)  
**CVC**: Any 3 digits (e.g., 123)  
**ZIP**: Any 5 digits (e.g., 12345)

---

**Need Help?** If you encounter issues:
1. Check Stripe Dashboard → Developers → Logs for API errors
2. Verify your `.env` file format
3. Check backend logs for specific error messages
4. Review Stripe documentation for your specific use case

