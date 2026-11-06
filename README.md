# HORIZON

A production-ready AI platform: register, chat with independently hosted models, token allowances, subscriptions, Bitcoin conversion workflow, benchmarks, and admin dashboard.

## Stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS v4
- Prisma 6 + PostgreSQL
- NextAuth v5 (Auth.js) credentials + optional Google
- Stripe (GBP recurring subscriptions)
- OpenAI-compatible local AI inference server

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy env:
   ```
   copy .env.example .env
   ```
   Fill secrets (NEXTAUTH_SECRET, DATABASE_URL, STRIPE_*, AI_SERVER_BASE_URL, ADMIN_*).

3. Start PostgreSQL (docker):
   ```
   docker run --name horizon-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=horizon -p 5432:5432 -d postgres:16
   ```
   Or use your own instance.

4. Push schema + seed:
   ```
   npm run db:push
   npm run db:seed
   ```

5. Run dev:
   ```
   npm run dev
   ```
   Open http://localhost:3000. Admin login: (ADMIN_EMAIL / ADMIN_PASSWORD).

## Local AI server

See `local-ai-server/README.md`. Start it on your PC, then connect via secure tunnel and set `AI_SERVER_BASE_URL` to the tunnel URL (server-side only). Set `AI_SERVER_API_KEY` to match.

## Stripe webhooks (local)
Use Stripe CLI:
```
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
Set `STRIPE_WEBHOOK_SECRET` to the signing secret.

## Bitcoin conversion workflow
- Payments are recorded as SUCCEEDED with Payment rows.
- A `BitcoinConversion` row is created in `MANUAL_REQUIRED` status after a successful subscription checkout.
- Admin converts/sends BTC manually (or via a configured provider) and records the txid in Admin > Conversions / Withdrawals.
- GBP->BTC automation is intentionally NOT faked; implement a provider adapter under `/src/lib/bitcoin` if your exchange supports it.

## Benchmarks
Admin > Benchmarks selects models/tests and runs them against the live inference server, storing real latency/tokens/sec and auto-correctness scores where an expected answer exists. Publish results to show on the public Benchmarks page. Manual scores are tracked with `manuallyEntered`.

## Security notes
- All secrets server-side via env.
- Token accounting is server-authoritative.
- Webhook signature verification enforced when configured.
- Never expose AI server URL/keys to frontend.

## Deployment
- Build: `npm run build`.
- Set all env vars in production.
- Use managed PostgreSQL.
- Run behind HTTPS. Set NEXTAUTH_URL to production domain.
- Run local AI server tunnel with a stable domain and restrict by API key + IP allowlist.

## Connecting PC -> website
1. Start local-ai-server on 127.0.0.1:8080.
2. Start a secure tunnel (Cloudflare Tunnel recommended).
3. Set `AI_SERVER_BASE_URL` to tunnel URL and `AI_SERVER_API_KEY`.
4. Restart website.
5. Admin > Server > Run health check.