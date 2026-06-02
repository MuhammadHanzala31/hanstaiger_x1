# Phase 2 — Public Booking Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Follow superpowers:frontend-design principles for UI fidelity.

**Goal:** Build the pixel-faithful public booking wizard at `/book/[slug]` — an intro carousel plus 4 steps (Dates → Guests → Experience → Details) — backed by server-authoritative draft state and the Phase 1 pricing/availability libs. Checkout handoff is stubbed (Phase 3 wires Stripe).

**Architecture:** Next.js App Router. The wizard is a client component tree for interactivity, but every mutation goes through Server Actions that persist to `booking_drafts` (service-role) and recompute price via `lib/pricing.ts`. Availability comes from `availability_blocks` + confirmed `bookings`, validated via `lib/availability.ts`. Draft id lives in an httpOnly cookie. Catalog (yacht, services) is read in Server Components.

**Tech Stack:** Next.js 16, React 19, Tailwind v4, TypeScript. Hosted Supabase (ref `ynemvghxsimezmsdewkh`). Design source: screenshots + Figma tokens (below). No new heavy deps; build the calendar and stepper by hand for full design control.

**Fidelity source:** Build from the user's screenshots for layout; use the exact tokens below for color/type/spacing. Do NOT make more Figma MCP reads (quota is ~6/month and nearly spent).

---

## Design Tokens (from Figma `get_variable_defs`)

**Font family:** `"Helvetica Neue", Helvetica, "Inter", Arial, sans-serif` (brand font is Helvetica Neue; match it — pixel-perfect to the client's design takes precedence over font novelty). Weights: Light 300, Regular 400, Medium 500.

**Colors → CSS variables (in `app/globals.css`) and Tailwind theme:**
```
--grey-900: #111213;   /* near-black backgrounds / text */
--grey-800: #303236;
--grey-700: #4f5257;
--grey-500: #83868e;
--grey-400: #989ba2;   /* secondary text on dark */
--grey-300: #aeb0b5;
--grey-200: #c5c7cb;
--grey-100: #dfe0e3;
--grey-50:  #f4f4f5;
--white:    #ffffff;
--orange-400: #f37021; /* primary CTA */
--orange-500: #d5570c; /* CTA hover */
--orange-700: #742f06;
--obsession-red-400: #ff5029;
--brown-50: #f3f0ed;
```

**Type scale (px / line-height / weight / letter-spacing):**
```
title-3:  56 / 68 / 300 / -0.4   (hero step titles: "Select your dates")
h1:       56 / 64 / 400 / 0
h3:       40 / 44 / 400 / 0
h6:       20 / 24 / 400 / 0
body-1:   18 / 24 / 400
body-2:   16 / 22 / 400|500
body-3:   14 / 20 / 400|500
body-4:   13 / 17 / 400
label-1:  16 / 22 / 400 / 0.2
button-1: 14 / 20 / 400 / 0.2
button-2: 12 / 16 / 400 / 0.2
caption-1:12 / 12 / 500 / 0.4   (UPPERCASE section labels)
caption-3:10 / 15 / 500 / 0.2
```

**Spacing scale:** 6, 8, 16, 32. **Border stroke:** 1px. **Frosted panels:** `backdrop-filter: blur(60px)` over a darkened hero image.

**Layout language (from screenshots):** Full-bleed dark hero photo of the yacht. Top bar: left wordmark "HANSTAIGER" (caption, letter-spaced), right an "✕" close. Left vertical step nav listing DATES / GUESTS / SERVICES / CONFIRM with entered value or "−". Big light Title-3 heading. Bottom-left "TOTAL AMOUNT" + big price. Bottom-right collapsible INFO panel. Primary actions use the orange button; "Next"/arrows advance steps. A sail/anchor mono logo mark sits bottom-left above the total.

---

## File Structure (Phase 2)

```
app/globals.css                          # tokens + base type + font
app/book/[slug]/page.tsx                 # server: load yacht+services+availability, create/load draft
app/book/[slug]/BookingWizard.tsx        # client: orchestrates steps + shared chrome
app/book/[slug]/confirmation/page.tsx    # success placeholder (Phase 3 fills real data)
components/booking/WizardChrome.tsx       # top bar, step nav, total footer, info panel
components/booking/IntroCarousel.tsx      # pre-booking 01..04 with progress bar + arrows
components/booking/Calendar.tsx           # range date picker (disables blocked days)
components/booking/GuestStepper.tsx       # -/+ guests, min/max
components/booking/ServicePicker.tsx      # categories + options, +/checkmark toggle
components/booking/DetailsForm.tsx        # name/email/phone + deposit terms
lib/booking/queries.ts                    # getYachtBySlug, getServicesForYacht, getAvailability
lib/booking/draft-actions.ts             # 'use server' actions: create/update draft, reprice
lib/booking/draft-cookie.ts              # httpOnly draft-id cookie get/set
lib/booking/types.ts                      # DraftState, WizardStep, view models
tests/unit/draft-reprice.test.ts          # unit: server reprice maps DB row -> computeBreakdown
tests/e2e/booking-happy-path.spec.ts       # Playwright: intro -> dates -> guests -> services -> details
```

---

## Task 1: Design system — tokens, font, base styles

**Files:** Modify `app/globals.css`; Modify `app/layout.tsx`.

- [ ] **Step 1:** In `app/globals.css`, define all CSS variables above under `:root`, set `body` font-family to the Helvetica Neue stack, base color `--grey-900` background option, and add Tailwind v4 `@theme` mappings so classes like `bg-grey-900`, `text-orange-400`, `font-light` resolve. Add utility classes for the type scale (`.t-title3`, `.t-h6`, `.t-caption1`, `.t-button1`, etc.) with exact size/line-height/letter-spacing/weight.
- [ ] **Step 2:** In `app/layout.tsx`, set `<html lang="en">`, metadata title "Hanstaiger · Book the X1", and ensure the font stack is applied globally. Remove the default Next scaffold fonts (Geist) if present.
- [ ] **Step 3:** Replace `app/page.tsx` with a minimal landing that links to `/book/x1` (temporary entry point).
- [ ] **Step 4:** Run `npm run build`; expect success. Commit: `git add -A && git commit -m "feat(ui): add Hanstaiger design tokens, type scale, and base styles"`

## Task 2: Booking data queries

**Files:** Create `lib/booking/types.ts`, `lib/booking/queries.ts`.

- [ ] **Step 1:** In `types.ts` define view models: `Yacht` (camelCase mirror of the row incl. pricing fields used by `YachtPricing`), `ServiceWithOptions` (`{ id, name, category, description, options: {id,name,price}[] }`), `BlockedRange` (reuse from `lib/availability`), and `DraftState` (`{ id, yachtId, startDate, endDate, guests, selectedOptions: SelectedOption[], total, deposit }`).
- [ ] **Step 2:** In `queries.ts` (server-only): `getYachtBySlug(slug)` via the anon server client (RLS allows active reads); `getServicesForYacht(yachtId)` joining `yacht_services`+`services`+`service_options` honoring `price_override`; `getAvailability(yachtId)` returning blocked ranges from `availability_blocks` UNION confirmed `bookings`. Map snake_case→camelCase. Return `null` when yacht missing.
- [ ] **Step 3:** Manually verify against the live DB by temporarily logging in a server component (or a one-off script) that `getYachtBySlug('x1')` returns the seeded yacht with `basePrice: 2000000`. Remove the temp log. Commit: `git add -A && git commit -m "feat(booking): add catalog + availability queries"`

## Task 3: Draft cookie + server actions (with unit test)

**Files:** Create `lib/booking/draft-cookie.ts`, `lib/booking/draft-actions.ts`, `tests/unit/draft-reprice.test.ts`.

- [ ] **Step 1 (TDD):** Write `tests/unit/draft-reprice.test.ts` for a pure helper `repriceDraft(yacht, guests, selectedOptions)` that adapts DB/view types into `computeBreakdown` and returns `{ total, deposit, lineItems }`. Assert: X1 (base 2000000, included 4, extra 500000, 20%) with 6 guests + one 120000 option → total 3120000, deposit 624000, and `lineItems` includes base, guest-extra, and the option. Run → FAIL.
- [ ] **Step 2:** Implement `repriceDraft` in `lib/booking/draft-actions.ts` (pure, exported) using `computeBreakdown`. Run test → PASS.
- [ ] **Step 3:** Add `draft-cookie.ts`: `getDraftId()`/`setDraftId(id)`/`clearDraftId()` using `next/headers` cookies, httpOnly, sameSite lax, 60-min maxAge.
- [ ] **Step 4:** Add `'use server'` actions in `draft-actions.ts` using the **service-role** client: `ensureDraft(yachtId)` (reuse cookie draft if valid+unexpired else insert new, set cookie), `setDates(start,end)` (validate via `validateRange` against live availability; return `{error}` if invalid), `setGuests(n)` (clamp to yacht min/max-guests), `setServices(optionIds)`; each recomputes with `repriceDraft`, updates the row, and returns the new `DraftState`. Commit: `git add -A && git commit -m "feat(booking): draft cookie + server-authoritative draft actions"`

## Task 4: Wizard chrome + intro carousel

**Files:** Create `components/booking/WizardChrome.tsx`, `components/booking/IntroCarousel.tsx`, `app/book/[slug]/page.tsx`, `app/book/[slug]/BookingWizard.tsx`.

- [ ] **Step 1:** `page.tsx` (server): load yacht (404 if missing), services, availability; `ensureDraft`; pass all as props to `BookingWizard`.
- [ ] **Step 2:** `WizardChrome.tsx` (client): the shared shell — dark hero bg with the yacht image + gradient overlay, top bar (HANSTAIGER wordmark + ✕), left step nav (DATES/GUESTS/SERVICES/CONFIRM, each showing current value or "−", clickable to jump), bottom-left logo mark + "TOTAL AMOUNT" + `formatEUR(total)`, bottom-right collapsible INFO panel. Accepts `step`, `onStepChange`, `draft`, `yacht` props and renders `children` as the active step body.
- [ ] **Step 3:** `IntroCarousel.tsx` (client): the pre-booking screens "Book the X1 experience" with `01/04..04/04`, a thin progress bar that animates and auto-advances (CSS/`requestAnimationFrame`), left/right arrow nav, and a "Customize your experience" orange CTA that enters the wizard at the Dates step. Copy per screenshots.
- [ ] **Step 4:** `BookingWizard.tsx` (client): holds `step` state and the current `DraftState`; renders IntroCarousel first, then WizardChrome wrapping the active step. Wire step transitions. Build OK. Commit: `git add -A && git commit -m "feat(booking): wizard chrome + intro carousel"`

## Task 5: Step bodies — Calendar, Guests, Services, Details

**Files:** Create `components/booking/Calendar.tsx`, `GuestStepper.tsx`, `ServicePicker.tsx`, `DetailsForm.tsx`; wire into `BookingWizard.tsx`.

- [ ] **Step 1 — Calendar:** hand-built month grid range picker. Disable days that are blocked (from availability) or out of season; on a valid range call `setDates`; show inline error for `min_nights`/`max_nights`/`unavailable`. Match screenshot styling (dark popover, orange selected range).
- [ ] **Step 2 — GuestStepper:** −/＋ control starting at `includedGuests`, clamped `[includedGuests..maxGuests]` (X1: 4..12); calls `setGuests`; copy "Includes N guests, with an extra cost per guest."
- [ ] **Step 3 — ServicePicker:** categories with options; each option toggles "+"↔checkmark and calls `setServices` with the full selected set; "Clear all"; skippable ("You can skip this step…"); shows option prices via `formatEUR`.
- [ ] **Step 4 — DetailsForm:** name/email/phone (HTML5 validation), deposit terms line using the computed deposit + mode, and a "Proceed to checkout" button that (Phase 2) navigates to `/book/[slug]/confirmation?draft=…` as a stub. Add a minimal `confirmation/page.tsx` summary.
- [ ] **Step 5:** Build + `npx tsc --noEmit` clean. Commit: `git add -A && git commit -m "feat(booking): calendar, guests, services, and details steps"`

## Task 6: E2E happy path + final verify

**Files:** Create `tests/e2e/booking-happy-path.spec.ts`.

- [ ] **Step 1:** Playwright test: visit `/book/x1`, advance through intro, pick a valid in-season range (e.g. 2026-06-01→06-05), set guests to 6, select one service option, fill details, click Proceed, and assert the confirmation page shows the expected total via visible text. Use a date helper to pick days that aren't blocked.
- [ ] **Step 2:** Run `npm run test:unit` (all pass incl. new reprice test) and `npm run test:e2e` (happy path passes; dev server auto-starts). If the env can't run the browser, document and run a `--list` to confirm the test is wired.
- [ ] **Step 3:** `npm run build` clean. Commit: `git add -A && git commit -m "test(booking): e2e happy-path through the wizard"`

---

## Self-Review (against spec §Booking Flow)

- Steps 00–04 (intro, dates, guests, services, details/checkout) → Tasks 4 & 5. ✔
- Live total + server-authoritative repricing every step → Task 3 (`repriceDraft`, actions). ✔
- Calendar disables blocked/booked + enforces min/max nights + season → Task 5 Step 1 via `lib/availability`. ✔
- Drafts persisted server-side with cookie + 60-min expiry → Task 3. ✔
- Guests min/max (4..12), services +/checkmark, skippable → Task 5. ✔
- Checkout handoff stubbed; Stripe is Phase 3 (correctly out of scope here). ✔
- Pixel fidelity → tokens (this doc) + screenshots + frontend-design skill. ✔

**Placeholder scan:** none — every task has concrete files, types, and acceptance values.
**Type consistency:** `DraftState`, `SelectedOption` (from `lib/types`), `repriceDraft(yacht, guests, options)` used consistently across Tasks 2–5.
