# BloodTest AI

Privacy-first blood test interpretation powered by AI. Users upload or enter blood test results and receive personalized explanations based on their age and gender. No data is stored.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- A [Gemini API key](https://aistudio.google.com/apikey)
- A [Stripe account](https://dashboard.stripe.com/register) (for payments)
- An [Upstash Redis](https://upstash.com/) instance (for rate limiting and usage tracking, free tier works)

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Create your environment file:**

   ```bash
   cp .env.example .env.local
   ```

3. **Fill in `.env.local` with your keys:**

   | Variable | Where to get it |
   |----------|----------------|
   | `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
   | `STRIPE_SECRET_KEY` | Stripe Dashboard > Developers > API keys |
   | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Same as above (publishable key) |
   | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard > Developers > Webhooks (or Stripe CLI) |
   | `STRIPE_PRICE_ONE_TIME` | Create a product in Stripe, copy the price ID |
   | `STRIPE_PRICE_WEEKLY` | Same — create a recurring weekly price |
   | `STRIPE_PRICE_MONTHLY` | Same — create a recurring monthly price |
   | `STRIPE_PRICE_YEARLY` | Same — create a recurring yearly price |
   | `UPSTASH_REDIS_REST_URL` | [Upstash Console](https://console.upstash.com/) > your database > REST API |
   | `UPSTASH_REDIS_REST_TOKEN` | Same as above |
   | `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` for dev, your domain for prod |
   | `FREE_ANALYSIS_LIMIT` | Number of free analyses (default: `2`) |

4. **Run the dev server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Stripe Setup

1. Go to [Stripe Dashboard > Products](https://dashboard.stripe.com/products) and create the following:
   - **One-Time Analysis** — one-time price (e.g. $2)
   - **Weekly Plan** — recurring weekly price (e.g. $3/week)
   - **Monthly Plan** — recurring monthly price (e.g. $9/month)
   - **Yearly Plan** — recurring yearly price (e.g. $59/year)

2. Copy each price ID (`price_...`) into your `.env.local`.

3. For local webhook testing, install the [Stripe CLI](https://stripe.com/docs/stripe-cli) and run:

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   Copy the webhook signing secret it prints into `STRIPE_WEBHOOK_SECRET`.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Add all environment variables from `.env.local` in Vercel's project settings.
4. Update `NEXT_PUBLIC_APP_URL` to your production domain.
5. Add a webhook endpoint in Stripe Dashboard pointing to `https://yourdomain.com/api/webhooks/stripe`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
