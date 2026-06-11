# Astro Exchange — Public Website + Live Dashboard

A marketing site and live activity dashboard for the Astro Exchange Discord
bot (crypto escrow, middleman, exchange, advertising slots, digital shop and
casino). No accounts, no login — just a fast, futuristic showcase that pulls
live data from the bot's API.

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Turbopack) + TypeScript
- Tailwind CSS v4
- Framer Motion for animation
- [`qrcode`](https://www.npmjs.com/package/qrcode) for generating LTC payment QR codes

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_ASTRO_API_URL` | Base URL of the bot's Express API (no trailing slash), e.g. `https://astro-exchange-bot.up.railway.app`. If unset, the dashboard renders in an "Offline / Not configured" state and the slot-purchase flow shows an inline error. |
| `NEXT_PUBLIC_DISCORD_INVITE` | Discord invite URL used by all "Join Discord" CTAs. |
| `NEXT_PUBLIC_SHOP_URL` | Link to the digital shop, used by all "Visit Shop" CTAs. |

All API calls are read-only (except the slot-order flow), have a 5-second
timeout, and fail gracefully — the page renders fully even if the API is
completely down.

## Project Structure

```
app/
  layout.tsx        Root layout, fonts, metadata
  page.tsx          Assembles all sections
  globals.css       Theme tokens (colors, animations)
components/
  layout/           Header, Footer
  sections/         Hero, LiveTicker, ServicesGrid, LiveDashboard,
                     Pricing, Fees, Testimonials, CtaSection
  ui/               Reusable building blocks (StatCard, ActivityFeed,
                     ConnectionBadge, AnimatedBackground, icons, ...)
  modals/           SlotPurchaseModal (3-step LTC payment flow)
lib/
  api.ts            Typed API client with timeouts + fallbacks
  config.ts         Static content: services, pricing, fees, testimonials
  format.ts         Currency / relative-time formatting helpers
  types.ts          Shared TypeScript types for the bot API
  hooks/            useTickerPrices, useDashboardData, useQrCode
```

## API Endpoints Used

All endpoints are read from `NEXT_PUBLIC_ASTRO_API_URL`:

- `GET /api/health`
- `GET /api/stats`
- `GET /api/ltc`
- `GET /api/feed?limit=15` (polled every 30s)
- `GET /api/slots`
- `POST /api/slot-order`
- `GET /api/slot-order/:id` (polled every 10s while a payment is pending)

Other ticker prices (BTC, ETH, SOL, USDT) come from the public CoinGecko API
and fall back to `—` if unavailable.

## CORS

Add the website's deployed origin to the bot's `api.js` CORS configuration,
e.g.:

```js
app.use(cors({ origin: "https://your-site.vercel.app" }));
```

Add `http://localhost:3000` as well for local development.

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into [Vercel](https://vercel.com/new).
3. Add the environment variables above in the Vercel project settings
   (Production and Preview).
4. Deploy. Vercel will run `npm run build` automatically.

## Notes

- Fee tables in `lib/config.ts` (`PAYPAL_TO_CRYPTO_FEES`, `CRYPTO_TO_CRYPTO_FEES`)
  and the escrow/middleman percentages in `components/sections/Fees.tsx` are
  placeholders — update them to match your actual rates.
- Pricing tiers/durations and prices live in `lib/config.ts`
  (`SLOT_TIERS`, `SLOT_DURATIONS`, `SLOT_PRICES`).
