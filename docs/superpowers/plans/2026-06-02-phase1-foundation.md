# Phase 1 — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Next.js + Supabase project skeleton with the full database schema, RLS, seed data, and a fully unit-tested pricing/availability/deposit logic library — the authoritative foundation every later phase builds on.

**Architecture:** Next.js App Router app with Supabase (local CLI for dev) as the Postgres backend. Money is integer cents. All money-critical math (pricing, deposit, availability validation) lives in pure, framework-free functions in `lib/` and is covered by Vitest. No UI in this phase beyond the default scaffold.

**Tech Stack:** Next.js (App Router, TypeScript), Tailwind CSS, Supabase (Postgres + CLI), `@supabase/supabase-js`, `@supabase/ssr`, Vitest, Playwright (installed, used heavily in later phases).

**Overall phasing (context):** Phase 1 Foundation → Phase 2 Public booking flow → Phase 3 Payments (Stripe + email) → Phase 4 Admin panel. This document covers Phase 1 only.

---

## File Structure (Phase 1)

```
package.json, tsconfig.json, next.config.ts, tailwind.config.ts   # scaffold
.env.local.example                                                # env template
app/layout.tsx, app/page.tsx                                      # default shell
lib/money.ts                                                       # cents <-> EUR helpers
lib/pricing.ts                                                     # computeTotal, computeDeposit
lib/availability.ts                                                # date/range validation
lib/types.ts                                                       # shared domain types
lib/supabase/server.ts, lib/supabase/client.ts, lib/supabase/service.ts
supabase/config.toml                                              # supabase init
supabase/migrations/0001_init.sql                                # all tables
supabase/migrations/0002_rls.sql                                 # RLS policies
supabase/seed.sql                                                # X1 yacht + services
tests/unit/money.test.ts
tests/unit/pricing.test.ts
tests/unit/availability.test.ts
vitest.config.ts
playwright.config.ts
```

---

## Task 1: Scaffold the Next.js app

**Files:**
- Create: project root files via `create-next-app`

- [ ] **Step 1: Create the app non-interactively**

Run (PowerShell, in the project root `c:/MyWork/booking-reservation-app`):
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-npm --no-turbopack --yes
```
Expected: a Next.js project is generated in the current directory (the `docs/` folder already present is preserved).

- [ ] **Step 2: Verify it builds and runs**

Run:
```bash
npm run build
```
Expected: build completes with no errors.

- [ ] **Step 3: Add a .gitignore entry for env files (verify present)**

Confirm `.gitignore` contains `.env*.local`. If missing, add the line `.env*.local`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with TypeScript and Tailwind"
```

---

## Task 2: Install dependencies and create env template

**Files:**
- Create: `.env.local.example`

- [ ] **Step 1: Install runtime + dev dependencies**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitest/coverage-v8 @playwright/test supabase
```
Expected: packages install with no errors.

- [ ] **Step 2: Create `.env.local.example`**

```bash
# Supabase (from `supabase status` for local, or project settings for remote)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=replace-me
SUPABASE_SERVICE_ROLE_KEY=replace-me

# Stripe (Phase 3)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Resend (Phase 3)
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: add Supabase/test deps and env template"
```

---

## Task 3: Initialize Supabase and write the schema migration

**Files:**
- Create: `supabase/config.toml` (via `supabase init`)
- Create: `supabase/migrations/0001_init.sql`

- [ ] **Step 1: Initialize Supabase**

Run:
```bash
npx supabase init
```
Expected: `supabase/config.toml` created. (Answer "N" to VS Code settings prompt if asked; non-interactive flag `--with-vscode-settings=false` may be appended if it prompts.)

- [ ] **Step 2: Write the schema migration**

Create `supabase/migrations/0001_init.sql`:
```sql
-- All money columns are integer cents. Currency EUR.

create extension if not exists "pgcrypto";

create type deposit_mode as enum ('percent', 'flat');
create type block_reason as enum ('booked', 'maintenance', 'hold');
create type booking_status as enum ('pending_payment', 'confirmed', 'cancelled', 'expired');

create table yachts (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  tagline text,
  description text,
  hero_image text,
  gallery text[] default '{}',
  base_price integer not null default 0,
  included_guests integer not null default 1,
  extra_guest_price integer not null default 0,
  max_guests integer not null default 12,
  min_nights integer not null default 1,
  max_nights integer not null default 30,
  deposit_mode deposit_mode not null default 'percent',
  deposit_value integer not null default 20,        -- percent (0-100) or cents if flat
  season_start date,
  season_end date,
  currency text not null default 'EUR',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  description text,
  icon text,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table service_options (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id) on delete cascade,
  name text not null,
  price integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0
);

create table yacht_services (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts(id) on delete cascade,
  service_id uuid not null references services(id) on delete cascade,
  price_override integer,
  is_active boolean not null default true,
  unique (yacht_id, service_id)
);

create table availability_blocks (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason block_reason not null default 'hold',
  note text,
  created_at timestamptz not null default now()
);

create table booking_drafts (
  id uuid primary key default gen_random_uuid(),
  yacht_id uuid not null references yachts(id) on delete cascade,
  start_date date,
  end_date date,
  guests integer not null default 1,
  selected_options jsonb not null default '[]',     -- [{option_id, name, price}]
  computed_total integer not null default 0,
  computed_deposit integer not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '60 minutes')
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  draft_id uuid references booking_drafts(id),
  yacht_id uuid not null references yachts(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  start_date date not null,
  end_date date not null,
  guests integer not null,
  line_items jsonb not null default '[]',
  total integer not null,
  deposit integer not null,
  currency text not null default 'EUR',
  stripe_session_id text,
  stripe_payment_intent text,
  status booking_status not null default 'pending_payment',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index on availability_blocks (yacht_id, start_date, end_date);
create index on bookings (yacht_id, status);
create index on booking_drafts (expires_at);
```

- [ ] **Step 3: Start local Supabase and apply the migration**

Run:
```bash
npx supabase start
```
Expected: Docker containers start; prints API URL, anon key, service_role key. (Docker Desktop must be running.)

- [ ] **Step 4: Verify migration applied**

Run:
```bash
npx supabase db reset
```
Expected: migrations + seed re-applied with no SQL errors. (Seed added in Task 5; for now seed is empty/absent — that's fine.)

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(db): add schema migration for yachts, services, availability, bookings"
```

---

## Task 4: Row Level Security policies

**Files:**
- Create: `supabase/migrations/0002_rls.sql`

- [ ] **Step 1: Write RLS migration**

Create `supabase/migrations/0002_rls.sql`:
```sql
alter table yachts enable row level security;
alter table services enable row level security;
alter table service_options enable row level security;
alter table yacht_services enable row level security;
alter table availability_blocks enable row level security;
alter table booking_drafts enable row level security;
alter table bookings enable row level security;

-- Public (anon + authenticated) may READ only active public catalog + availability.
create policy "public read active yachts" on yachts
  for select using (is_active = true);
create policy "public read active services" on services
  for select using (is_active = true);
create policy "public read active service_options" on service_options
  for select using (is_active = true);
create policy "public read active yacht_services" on yacht_services
  for select using (is_active = true);
create policy "public read availability" on availability_blocks
  for select using (true);

-- Authenticated admins may read/write everything (admin role check refined in Phase 4).
create policy "admin all yachts" on yachts
  for all to authenticated using (true) with check (true);
create policy "admin all services" on services
  for all to authenticated using (true) with check (true);
create policy "admin all service_options" on service_options
  for all to authenticated using (true) with check (true);
create policy "admin all yacht_services" on yacht_services
  for all to authenticated using (true) with check (true);
create policy "admin all availability" on availability_blocks
  for all to authenticated using (true) with check (true);
create policy "admin read bookings" on bookings
  for select to authenticated using (true);
create policy "admin update bookings" on bookings
  for update to authenticated using (true) with check (true);

-- booking_drafts and booking writes happen via the service role (Server Actions),
-- which bypasses RLS. No anon write policies are defined, so anon cannot write.
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
npx supabase db reset
```
Expected: both migrations apply with no errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): add row level security policies"
```

---

## Task 5: Seed data (X1 yacht + service catalog)

**Files:**
- Create: `supabase/seed.sql`

- [ ] **Step 1: Write seed**

Create `supabase/seed.sql`:
```sql
insert into yachts (slug, name, tagline, base_price, included_guests, extra_guest_price,
  max_guests, min_nights, max_nights, deposit_mode, deposit_value, season_start, season_end, sort_order)
values (
  'x1', 'Hanstaiger X1', 'Book the X1 experience',
  2000000, 4, 500000, 12, 3, 14, 'percent', 20,
  '2026-05-01', '2026-10-31', 0
);

with svc as (
  insert into services (name, category, description, sort_order) values
    ('Private chef', 'dining', 'Tailored onboard dining', 0),
    ('Jetskis', 'water', 'High-performance jetskis', 1),
    ('Spa & Massage', 'wellness', 'Onboard wellness', 2),
    ('Water Toys', 'water', 'Seabobs, paddleboards, and more', 3)
  returning id, name
)
insert into service_options (service_id, name, price, sort_order)
select id, opt.name, opt.price, opt.ord from svc, lateral (
  values
    ('Private chef','Breakfast', 50000, 0),
    ('Private chef','Lunch', 80000, 1),
    ('Private chef','Dinner', 120000, 2),
    ('Jetskis','Half day', 60000, 0),
    ('Jetskis','Full day', 100000, 1),
    ('Spa & Massage','Single session', 40000, 0),
    ('Water Toys','Full package', 70000, 0)
) as opt(svc_name, name, price, ord)
where opt.svc_name = svc.name;

-- link all services to the X1 with default prices
insert into yacht_services (yacht_id, service_id)
select y.id, s.id from yachts y cross join services s where y.slug = 'x1';
```

- [ ] **Step 2: Apply and verify**

Run:
```bash
npx supabase db reset
```
Expected: seed inserts succeed; querying `select count(*) from service_options;` returns 7.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(db): seed X1 yacht and service catalog"
```

---

## Task 6: Money helpers (TDD)

**Files:**
- Create: `lib/money.ts`
- Test: `tests/unit/money.test.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Create vitest config**

Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: { environment: 'node', include: ['tests/unit/**/*.test.ts'] },
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
});
```

Add to `package.json` scripts: `"test:unit": "vitest run"`.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/money.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { formatEUR } from '@/lib/money';

describe('formatEUR', () => {
  it('formats whole-euro cents with thousands separators', () => {
    expect(formatEUR(2000000)).toBe('20.000 €');
  });
  it('formats zero', () => {
    expect(formatEUR(0)).toBe('0 €');
  });
  it('formats cents with decimals', () => {
    expect(formatEUR(123456)).toBe('1.234,56 €');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit -- money`
Expected: FAIL — `formatEUR` not found / module missing.

- [ ] **Step 4: Implement `lib/money.ts`**

```ts
// All monetary amounts in this app are integer cents.
export function formatEUR(cents: number): string {
  const hasDecimals = cents % 100 !== 0;
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit -- money`
Expected: PASS (3 tests). If the non-breaking-space assertion mismatches the runtime ICU output, align the expected strings to the actual `Intl` output and keep the test.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(lib): add EUR money formatting helper with tests"
```

---

## Task 7: Pricing engine (TDD)

**Files:**
- Create: `lib/types.ts`
- Create: `lib/pricing.ts`
- Test: `tests/unit/pricing.test.ts`

- [ ] **Step 1: Define shared types**

Create `lib/types.ts`:
```ts
export type DepositMode = 'percent' | 'flat';

export interface YachtPricing {
  basePrice: number;          // cents, flat per charter
  includedGuests: number;
  extraGuestPrice: number;    // cents per extra guest
  maxGuests: number;
  depositMode: DepositMode;
  depositValue: number;       // percent (0-100) or cents (flat)
}

export interface SelectedOption {
  optionId: string;
  name: string;
  price: number;              // cents
}

export interface PriceBreakdown {
  base: number;
  guestExtra: number;
  servicesSum: number;
  total: number;
  deposit: number;
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/unit/pricing.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { computeBreakdown } from '@/lib/pricing';
import type { YachtPricing, SelectedOption } from '@/lib/types';

const yacht: YachtPricing = {
  basePrice: 2000000,
  includedGuests: 4,
  extraGuestPrice: 500000,
  maxGuests: 12,
  depositMode: 'percent',
  depositValue: 20,
};

describe('computeBreakdown', () => {
  it('charges only base when guests are within included and no services', () => {
    const b = computeBreakdown(yacht, 4, []);
    expect(b.base).toBe(2000000);
    expect(b.guestExtra).toBe(0);
    expect(b.servicesSum).toBe(0);
    expect(b.total).toBe(2000000);
    expect(b.deposit).toBe(400000); // 20%
  });

  it('adds extra-guest cost above included guests', () => {
    const b = computeBreakdown(yacht, 6, []);
    expect(b.guestExtra).toBe(1000000); // 2 * 500000
    expect(b.total).toBe(3000000);
  });

  it('sums selected service options', () => {
    const opts: SelectedOption[] = [
      { optionId: 'a', name: 'Dinner', price: 120000 },
      { optionId: 'b', name: 'Jetskis', price: 100000 },
    ];
    const b = computeBreakdown(yacht, 4, opts);
    expect(b.servicesSum).toBe(220000);
    expect(b.total).toBe(2220000);
    expect(b.deposit).toBe(444000);
  });

  it('uses flat deposit when mode is flat', () => {
    const flat: YachtPricing = { ...yacht, depositMode: 'flat', depositValue: 300000 };
    const b = computeBreakdown(flat, 4, []);
    expect(b.deposit).toBe(300000);
  });

  it('never charges negative guest extra below included guests', () => {
    const b = computeBreakdown(yacht, 2, []);
    expect(b.guestExtra).toBe(0);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm run test:unit -- pricing`
Expected: FAIL — `computeBreakdown` not found.

- [ ] **Step 4: Implement `lib/pricing.ts`**

```ts
import type { YachtPricing, SelectedOption, PriceBreakdown } from './types';

export function computeBreakdown(
  yacht: YachtPricing,
  guests: number,
  options: SelectedOption[],
): PriceBreakdown {
  const base = yacht.basePrice;
  const extraGuests = Math.max(0, guests - yacht.includedGuests);
  const guestExtra = extraGuests * yacht.extraGuestPrice;
  const servicesSum = options.reduce((sum, o) => sum + o.price, 0);
  const total = base + guestExtra + servicesSum;
  const deposit =
    yacht.depositMode === 'percent'
      ? Math.round((total * yacht.depositValue) / 100)
      : yacht.depositValue;
  return { base, guestExtra, servicesSum, total, deposit };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test:unit -- pricing`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(lib): add server-authoritative pricing engine with tests"
```

---

## Task 8: Availability validation (TDD)

**Files:**
- Create: `lib/availability.ts`
- Test: `tests/unit/availability.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/availability.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { nightsBetween, validateRange } from '@/lib/availability';

const cfg = {
  minNights: 3,
  maxNights: 14,
  seasonStart: '2026-05-01',
  seasonEnd: '2026-10-31',
};
const blocks = [{ start: '2026-06-10', end: '2026-06-12' }];

describe('nightsBetween', () => {
  it('counts nights between two ISO dates', () => {
    expect(nightsBetween('2026-06-01', '2026-06-05')).toBe(4);
  });
});

describe('validateRange', () => {
  it('accepts a valid in-season range with no conflicts', () => {
    expect(validateRange('2026-06-01', '2026-06-05', cfg, blocks)).toEqual({ ok: true });
  });
  it('rejects ranges shorter than minNights', () => {
    const r = validateRange('2026-06-01', '2026-06-02', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('min_nights');
  });
  it('rejects ranges longer than maxNights', () => {
    const r = validateRange('2026-06-01', '2026-06-20', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('max_nights');
  });
  it('rejects ranges outside the season window', () => {
    const r = validateRange('2026-11-01', '2026-11-05', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('out_of_season');
  });
  it('rejects ranges overlapping a blocked period', () => {
    const r = validateRange('2026-06-09', '2026-06-13', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('unavailable');
  });
  it('rejects when end is not after start', () => {
    const r = validateRange('2026-06-05', '2026-06-05', cfg, blocks);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('invalid_range');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test:unit -- availability`
Expected: FAIL — functions not found.

- [ ] **Step 3: Implement `lib/availability.ts`**

```ts
export interface RangeConfig {
  minNights: number;
  maxNights: number;
  seasonStart?: string | null;
  seasonEnd?: string | null;
}
export interface BlockedRange { start: string; end: string; }
export type RangeResult =
  | { ok: true }
  | { ok: false; reason:
      'invalid_range' | 'min_nights' | 'max_nights' | 'out_of_season' | 'unavailable' };

const MS_PER_DAY = 86_400_000;

export function nightsBetween(start: string, end: string): number {
  return Math.round((Date.parse(end) - Date.parse(start)) / MS_PER_DAY);
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return Date.parse(aStart) < Date.parse(bEnd) && Date.parse(bStart) < Date.parse(aEnd);
}

export function validateRange(
  start: string,
  end: string,
  cfg: RangeConfig,
  blocks: BlockedRange[],
): RangeResult {
  const nights = nightsBetween(start, end);
  if (nights <= 0) return { ok: false, reason: 'invalid_range' };
  if (nights < cfg.minNights) return { ok: false, reason: 'min_nights' };
  if (nights > cfg.maxNights) return { ok: false, reason: 'max_nights' };
  if (cfg.seasonStart && Date.parse(start) < Date.parse(cfg.seasonStart))
    return { ok: false, reason: 'out_of_season' };
  if (cfg.seasonEnd && Date.parse(end) > Date.parse(cfg.seasonEnd))
    return { ok: false, reason: 'out_of_season' };
  for (const b of blocks) {
    if (rangesOverlap(start, end, b.start, b.end))
      return { ok: false, reason: 'unavailable' };
  }
  return { ok: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test:unit -- availability`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib): add availability/range validation with tests"
```

---

## Task 9: Supabase client helpers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/service.ts`

- [ ] **Step 1: Browser client**

Create `lib/supabase/client.ts`:
```ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

- [ ] **Step 2: Server client (cookie-aware, for Server Components / Actions)**

Create `lib/supabase/server.ts`:
```ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(items) {
          try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
          catch { /* called from a Server Component; safe to ignore */ }
        },
      },
    },
  );
}
```

- [ ] **Step 3: Service-role client (server-only, bypasses RLS — for booking writes)**

Create `lib/supabase/service.ts`:
```ts
import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

- [ ] **Step 4: Install `server-only` and verify typecheck**

Run:
```bash
npm install server-only
npx tsc --noEmit
```
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(lib): add Supabase browser/server/service-role clients"
```

---

## Task 10: Playwright config + verify full unit suite

**Files:**
- Create: `playwright.config.ts`

- [ ] **Step 1: Create Playwright config**

Create `playwright.config.ts`:
```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

Add to `package.json` scripts: `"test:e2e": "playwright test"`.

- [ ] **Step 2: Install Playwright browsers**

Run:
```bash
npx playwright install chromium
```
Expected: chromium installed.

- [ ] **Step 3: Run the whole unit suite**

Run:
```bash
npm run test:unit
```
Expected: all unit tests pass (money + pricing + availability).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add Playwright config and finalize Phase 1 test setup"
```

---

## Self-Review (against the spec)

**Spec coverage (Phase 1 portions):**
- Data model — Tasks 3/4/5 create every table, RLS, and seed. ✔
- Integer-cents money — Task 6. ✔
- Server-authoritative pricing (base + extra guests + services, % or flat deposit) — Task 7. ✔
- Availability rules (min/max nights, season window, overlap) — Task 8. ✔
- Supabase clients incl. service-role for booking writes — Task 9. ✔
- Test tooling (Vitest unit + Playwright) — Tasks 6/10. ✔
- Deferred to later phases (correctly not in Phase 1): booking wizard UI (Phase 2), Stripe + webhook + email (Phase 3), admin panel + auth (Phase 4).

**Placeholder scan:** No TBD/TODO; every code step contains complete code; every test step has real assertions.

**Type consistency:** `computeBreakdown(yacht, guests, options)` signature and `YachtPricing`/`SelectedOption`/`PriceBreakdown` types match between `lib/types.ts`, `lib/pricing.ts`, and its test. `validateRange`/`nightsBetween` signatures match between `lib/availability.ts` and its test.

**Note on seed prices:** base 2,000,000 cents = €20,000 (matches design step 01); extra guest 500,000 cents = €5,000 (4 included guests → €40,000 shown at 8 guests in design's "Choose your guests" total). Confirm exact figures against Figma during Phase 2 and adjust the seed if needed.
