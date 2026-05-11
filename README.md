# Dodo Payments + Next.js

A reference implementation of a secure SaaS subscription flow using **Next.js 16**, **Dodo Payments**, **Better Auth**, and **Drizzle ORM**.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Auth | Better Auth (email + password) |
| Payments | Dodo Payments |
| Database | PostgreSQL + Drizzle ORM |
| Rate limiting | Redis (ioredis) |
| UI | shadcn/ui + Tailwind CSS v4 |

## Features

- **Auth** — email/password sign-up and sign-in; middleware-guarded routes
- **Pricing tiers** — Free, Pro ($29/mo · $23/yr), Enterprise ($99/mo · $79/yr)
- **Subscription API** — `POST /api/subscription` creates a Dodo Payments checkout session; `PUT` handles plan changes (upgrades are immediate, downgrades/cycle-changes are deferred to the next billing date); `DELETE` cancels at period end
- **Webhook processing** — handles `subscription.active`, `.renewed`, `.plan_changed`, `.cancelled`, `.on_hold`, `.failed` with idempotent deduplication
- **Downgrade validation** — blocks downgrade if current usage exceeds target plan limits
- **Rate limiting** — sliding-window Redis rate limiter on subscription endpoints (no-op in development)

## Project Structure

```
src/
├── app/
│   ├── api/subscription/        # POST · PUT · DELETE + webhook handler
│   ├── account/                 # Account & billing page
│   └── auth/                    # Sign-in / sign-up page
├── components/subscription/     # Subscription dialog + plan-select UI
├── hooks/use-subscription.ts    # Client-side subscription state & actions
├── lib/
│   ├── auth/                    # Better Auth config + server helpers
│   ├── dodopayments/            # Dodo Payments SDK client
│   ├── drizzle/                 # Schema, migrations, queries
│   ├── pricing/                 # Plan definitions
│   ├── rate-limit.ts            # Redis rate limiter
│   ├── redis/                   # Lazy-init Redis client
│   └── subscription/            # Plan-change classification & downgrade validation
└── types/                       # Shared TypeScript types
```

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in all values:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/your_db

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=

# Dodo Payments
DODO_PAYMENTS_API_KEY=
DODO_PAYMENTS_ENVIRONMENT=test_mode   # or live_mode
DODO_PAYMENTS_WEBHOOK_KEY=

# Product IDs from your Dodo Payments dashboard
PRO_MONTHLY_PRODUCT_ID=
PRO_ANNUALLY_PRODUCT_ID=
ENTERPRISE_MONTHLY_PRODUCT_ID=
ENTERPRISE_ANNUALLY_PRODUCT_ID=

# Redis (required in production for rate limiting)
REDIS_URL=

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Run migrations

```bash
bun db:migrate
```

### 4. Start the dev server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database Scripts

| Command | Description |
|---|---|
| `bun db:generate` | Generate a new migration from schema changes |
| `bun db:migrate` | Apply pending migrations |
| `bun db:studio` | Open Drizzle Studio on port 3030 |

## Webhook Setup

Point your Dodo Payments webhook URL to:

```
https://your-domain.com/api/subscription/webhook
```

Required events: `subscription.active`, `subscription.renewed`, `subscription.plan_changed`, `subscription.cancelled`, `subscription.on_hold`, `subscription.failed`.
