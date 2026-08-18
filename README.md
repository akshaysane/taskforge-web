# Nritya Alankara Collections Web

Mobile-first React application for administering Bharatanatyam costume inventory. The owner can onboard tailor sets, track individual labelled pieces and measurements, search inventory, upload photos, print or scan QR labels, change lifecycle status, and manage the two administrator accounts.

## Stack

- React 19 and TypeScript
- Vite
- React Router
- Axios and Zustand
- Vitest and Testing Library
- Playwright desktop/mobile acceptance tests

## Local setup

Requirements: Node.js 20+, pnpm 10+, and the Nritya Alankara Collections API running at `http://localhost:3000`.

```bash
pnpm install
VITE_API_URL=http://localhost:3000 pnpm dev
```

Open `http://localhost:5173` and use one of the local seed accounts:

```text
srnatiya-admin      / srnatiya-local-admin
srnatiya-assistant  / srnatiya-local-admin
```

## Commands

```bash
pnpm test
pnpm test:e2e
pnpm typecheck
pnpm lint
pnpm build
```

Install the local Chromium runtime once before running browser tests:

```bash
pnpm exec playwright install chromium
```

Keep both the seeded backend and `pnpm dev` frontend running in separate terminals, then run `pnpm test:e2e` from a third terminal. The suite checks both desktop and mobile layouts. It covers login, dashboard counts, inventory search/detail, manual QR lookup, lifecycle transitions, configuration navigation, photo persistence, and the two-administrator invariant.

Override its defaults when needed:

```bash
E2E_BASE_URL=http://localhost:5173 \
E2E_ADMIN_USERNAME=srnatiya-admin \
E2E_ADMIN_PASSWORD=srnatiya-local-admin \
pnpm test:e2e
```

Camera scanning and physical printing still require a real phone/camera and printer. The browser suite verifies the manual scan path and QR/print UI without claiming hardware acceptance.

## Main routes

- `/dashboard`: inventory and onboarding summary
- `/inventory`: search, filter, and item cards
- `/inventory/:inventoryCode`: measurements, photos, lifecycle, QR label, and history
- `/scan`: camera or manual label lookup
- `/original-sets`: tailor-set onboarding
- `/designs`: design configuration
- `/configuration`: piece types and measurement definitions
- `/administrators`: owner accounts

## Production operations

The approved internal AWS release remains at `https://app.happyhabits.click` and calls `https://api.happyhabits.click`. Amplify builds fail unless `VITE_API_URL` equals that exact HTTPS API URL.

Release, rollback, domain-migration, and secret-handling procedures are maintained in `docs/operations/aws-production-runbook.md` in the backend repository. Production data must never be seeded or reset.
