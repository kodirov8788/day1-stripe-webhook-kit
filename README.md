# Day-1 Stripe Webhook Kit

**Portfolio demo**: Production-ready Next.js + Stripe subscription webhooks with proper security hardening.

## 🎯 What This Solves

Every freelance client accepting recurring payments needs **reliable webhook handling**. This kit demonstrates:

- ✅ **Signature verification** — rejects forged webhook calls
- ✅ **Idempotency** — processes each Stripe event exactly once
- ✅ **Raw body parsing** — required for webhook signature validation
- ✅ **Database sync** — keeps user/subscription state consistent with Stripe
- ✅ **TypeScript safety** — catches errors at compile time

Perfect for client projects that need subscriptions, memberships, or SaaS billing.

## 🛠 Tech Stack

- **Next.js 14** (App Router + API Routes)
- **TypeScript** — type safety throughout
- **Prisma** — type-safe database ORM
- **PostgreSQL** — production-grade database
- **Stripe** — payment processing + webhooks

## 📦 What's Included

### Database Schema (Prisma)

```prisma
User
  - email (unique)
  - stripeCustomerId (optional, unique)
  - subscriptions (relation)

Subscription
  - stripeSubscriptionId (unique)
  - status (active, canceled, etc.)
  - priceId
  - currentPeriodEnd

StripeEvent
  - stripeEventId (unique) ← idempotency key
  - type
  - processedAt
```

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/health` | GET | Health check + DB connectivity |
| `/api/checkout` | POST | Create Stripe Checkout session |
| `/api/webhooks/stripe` | POST | Process Stripe webhooks (hardened) |

### Webhook Security

The `/api/webhooks/stripe` route implements:

1. **Raw body access** — uses `request.text()` before any parsing
2. **Signature verification** — `stripe.webhooks.constructEvent()` validates authenticity
3. **Idempotency check** — inserts `stripeEventId` into DB first, skips duplicates
4. **Fast response** — returns 200 quickly, Stripe retries on failures

### Handled Events

- `checkout.session.completed` → creates user + subscription
- `customer.subscription.updated` → updates subscription status/period
- `customer.subscription.deleted` → marks subscription as canceled

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/kodirov8788/day1-stripe-webhook-kit.git
cd day1-stripe-webhook-kit
npm install
```

### 2. Set Up Database

Create a PostgreSQL database (Neon, Supabase, Railway, or local).

### 3. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your values:

```env
# Database (use pooled for app, direct for migrations)
DATABASE_URL="postgresql://user:password@host:5432/db?pgbouncer=true"
DIRECT_URL="postgresql://user:password@host:5432/db"

# Stripe keys (from https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Webhook secret (create endpoint at https://dashboard.stripe.com/test/webhooks)
STRIPE_WEBHOOK_SECRET="whsec_..."

# Price ID (create in Stripe Dashboard → Products)
STRIPE_PRICE_ID="price_..."

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Run Migrations

```bash
npx prisma migrate dev --name init
```

### 5. Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Test Webhooks Locally

Install Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook secret (`whsec_...`) to `.env` as `STRIPE_WEBHOOK_SECRET`.

Test a payment with Stripe test card:
- Card: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits

## 📤 Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Add environment variables from `.env`
4. Deploy

### 3. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Add endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret to Vercel env vars as `STRIPE_WEBHOOK_SECRET`
5. Redeploy

### 4. Run Migrations on Production

```bash
npx prisma migrate deploy
```

Or set up automatic migrations in your CI/CD pipeline.

## 🔐 Security Hardening Checklist

- ✅ Raw body parsing for signature verification
- ✅ Webhook signature validation (rejects forgeries)
- ✅ Idempotency via `StripeEvent` table
- ✅ No secrets in repository
- ✅ Environment variables for all sensitive data
- ✅ HTTPS-only webhooks in production
- ✅ Database constraints (unique indexes)

## 📚 Key Learnings for Clients

### Why Raw Body Matters

Stripe signatures are computed over the **raw request body**. If you parse JSON first, the signature check fails. Always use:

```typescript
const body = await request.text(); // ✅ Raw
const event = stripe.webhooks.constructEvent(body, signature, secret);
```

### Why Idempotency Matters

Stripe retries failed webhooks. Without idempotency, you might:
- Double-charge users
- Create duplicate subscriptions
- Send duplicate emails

Solution: store `event.id` in the database first, skip if it exists.

### Why Direct URL Matters (Prisma)

Connection poolers (PgBouncer) don't support migration commands. Prisma needs:
- `DATABASE_URL` — pooled connection (app queries)
- `DIRECT_URL` — direct connection (migrations only)

## 📁 Project Structure

```
day1-stripe-webhook-kit/
├── app/
│   ├── api/
│   │   ├── checkout/
│   │   │   └── route.ts          # Create Stripe session
│   │   ├── health/
│   │   │   └── route.ts          # Health check
│   │   └── webhooks/
│   │       └── stripe/
│   │           └── route.ts      # Webhook handler
│   ├── success/
│   │   └── page.tsx              # Success page
│   ├── layout.tsx
│   ├── page.tsx                  # Home (subscribe form)
│   └── globals.css
├── prisma/
│   └── schema.prisma             # Database schema
├── .env.example                  # Template for environment vars
├── package.json
└── README.md
```

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "ok": true,
  "db": true
}
```

### Create Checkout Session

```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

Expected response:
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

### Webhook (requires Stripe CLI)

```bash
stripe trigger checkout.session.completed
```

Check logs for processing confirmation.

## 🤝 Contributing

This is a portfolio demo. Feel free to fork and adapt for your own projects!

## 📄 License

MIT — use freely for client projects.

## 🙋 Questions?

Built by [@kodirov8788](https://github.com/kodirov8788) as an Upwork portfolio piece.

Demonstrates production-ready webhook handling for freelance clients.
