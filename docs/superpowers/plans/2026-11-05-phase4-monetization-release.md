# Phase 4: Monetization and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete monetization and deployment infrastructure for the product: Paddle/Lemon Squeezy credit purchasing, authoritative webhook verification, user authentication/session management, pricing & account dashboards, Docker/VPS deployment scaffolding, and comprehensive test suite validation.

**Architecture:** A lightweight freemium economy: all browser-native photo/video tools remain 100% free with no login required. Premium AI features (Background Removal, Speech Noise Removal) require an account, provide exactly 1 free run per feature, and consume credits thereafter (1 credit for photo BG removal; 1 credit per 30s of audio). Credits are sold in discrete packages via Paddle Merchant-of-Record checkout sessions and provisioned via cryptographic webhook callbacks into PostgreSQL. A multi-stage Docker + Caddy configuration enables deployment to a single low-cost $6–$10/mo VPS.

**Tech Stack:** Next.js 15 (App Router), Prisma, PostgreSQL, Paddle API / Webhooks, Node Crypto, Tailwind CSS, Docker, Caddy, Vitest.

**Spec:** `docs/PRD.md`

## Global Constraints

- Paddle Merchant of Record integration with Lemon Squeezy alternative ($0 monthly fixed fees).
- Credit economics:
  - Photo Background Removal: 1 credit per image.
  - Video Audio Noise Removal: 1 credit per 30 seconds of audio.
  - Initial free credits: Exactly 1 successful free run per feature per account (`APP_CONSTRAINTS.billing.initialFreeCredits = 1`).
- Media retention: 24 hours (`APP_CONSTRAINTS.storage.retentionHours = 24`).
- Single VPS deployment footprint ($6–$10/month).

## Review Focus

1. **Idempotent Webhook Processing:** Paddle webhooks must check transaction IDs to prevent duplicate credit allocations on webhook retries.
2. **Signature Verification:** Paddle webhook signatures (`Paddle-Signature` timestamp and HMAC-SHA256 hash) must be verified before granting any credits.
3. **Password Security:** Passwords must be hashed using PBKDF2/SHA-256 with unique cryptographic salts; plain text must never be logged or stored.
4. **Credit Atomic Updates:** Credit additions and deductions must create an audit trail in `CreditTransaction` tied to the user.
5. **Zero External Billing Dependencies on Free Runs:** Users on their free trial or using browser-native tools must never be blocked by billing APIs.

---

### Task 1: Credit Packages & Paddle/Lemon Squeezy Checkout Layer

**Files:**
- Create: `src/lib/billing/paddleClient.ts`
- Create: `src/app/api/billing/checkout/route.ts`
- Test: `tests/billing/paddleClient.test.ts`
- Test: `tests/api/checkoutRoute.test.ts`

**Interfaces:**
- Consumes: `CREDIT_PACKS`, `userId`, `packId`.
- Produces:
  - `CREDIT_PACKS`: Starter (50 credits / $5), Pro (200 credits / $15), Studio (500 credits / $30).
  - `createPaddleCheckoutSession(options: CheckoutOptions): Promise<CheckoutSessionResult>`
  - `POST /api/billing/checkout` endpoint returning `{ checkoutUrl, transactionId }`.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/billing/paddleClient.test.ts
import { describe, it, expect } from 'vitest';
import { CREDIT_PACKS, createPaddleCheckoutSession } from '@/lib/billing/paddleClient';

describe('Paddle Checkout Layer', () => {
  it('should define standard credit packages with volume discounts', () => {
    expect(CREDIT_PACKS.starter.credits).toBe(50);
    expect(CREDIT_PACKS.starter.priceUsd).toBe(5);
    expect(CREDIT_PACKS.pro.credits).toBe(200);
    expect(CREDIT_PACKS.pro.priceUsd).toBe(15);
    expect(CREDIT_PACKS.studio.credits).toBe(500);
    expect(CREDIT_PACKS.studio.priceUsd).toBe(30);
  });

  it('should generate a valid checkout session in test/mock mode', async () => {
    const session = await createPaddleCheckoutSession({
      userId: 'user_123',
      packId: 'pro',
      customerEmail: 'test@example.com',
    });
    expect(session.success).toBe(true);
    expect(session.checkoutUrl).toBeDefined();
    expect(session.checkoutUrl).toContain('checkout');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/billing/paddleClient.test.ts`
Expected: FAIL with "Cannot find module '@/lib/billing/paddleClient'".

- [ ] **Step 3: Implement `paddleClient.ts` and `/api/billing/checkout/route.ts`**

Define `CREDIT_PACKS`. Implement `createPaddleCheckoutSession` supporting Paddle API / sandbox with custom data (`userId`, `credits`, `packId`) and mock fallback for tests. Create `POST /api/billing/checkout` validating user authentication and pack choice.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/billing/paddleClient.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/paddleClient.ts src/app/api/billing/checkout/route.ts tests/billing/paddleClient.test.ts tests/api/checkoutRoute.test.ts
git commit -m "feat: implement credit packages and Paddle checkout session layer"
```

---

### Task 2: Authoritative Paddle Webhook Handler with Signature Verification

**Files:**
- Create: `src/lib/billing/paddleWebhookValidator.ts`
- Create: `src/app/api/webhooks/paddle/route.ts`
- Test: `tests/billing/paddleWebhookValidator.test.ts`
- Test: `tests/webhooks/paddleWebhook.test.ts`

**Interfaces:**
- Consumes: Raw webhook body, `Paddle-Signature` header, Paddle webhook secret.
- Produces:
  - `verifyPaddleWebhookSignature(rawBody: string, signatureHeader: string, secretKey: string): boolean`
  - `POST /api/webhooks/paddle` handler crediting user balance and creating `CreditTransaction` on `transaction.completed`.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/billing/paddleWebhookValidator.test.ts
import { describe, it, expect } from 'vitest';
import {
  verifyPaddleWebhookSignature,
  generatePaddleWebhookSignature,
} from '@/lib/billing/paddleWebhookValidator';

describe('Paddle Webhook Cryptographic Verification', () => {
  it('should verify authentic Paddle HMAC-SHA256 signatures', () => {
    const secret = 'pdl_ntfset_mock_secret_key_123';
    const payload = JSON.stringify({ event_type: 'transaction.completed', data: { id: 'txn_1' } });
    const signature = generatePaddleWebhookSignature(payload, secret);

    expect(verifyPaddleWebhookSignature(payload, signature, secret)).toBe(true);
  });

  it('should reject tampered payload or incorrect secret', () => {
    const secret = 'pdl_ntfset_mock_secret_key_123';
    const payload = JSON.stringify({ event_type: 'transaction.completed', data: { id: 'txn_1' } });
    const signature = generatePaddleWebhookSignature(payload, secret);

    expect(verifyPaddleWebhookSignature(payload + 'tamper', signature, secret)).toBe(false);
    expect(verifyPaddleWebhookSignature(payload, signature, 'wrong_secret')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/billing/paddleWebhookValidator.test.ts`
Expected: FAIL with "Cannot find module '@/lib/billing/paddleWebhookValidator'".

- [ ] **Step 3: Implement signature validation and webhook route**

Implement `verifyPaddleWebhookSignature` extracting `ts` and `h1` from `Paddle-Signature` and verifying `crypto.createHmac('sha256', secret).update(ts + ':' + rawBody).digest('hex')`. Implement `POST /api/webhooks/paddle` granting credits on `transaction.completed` / `transaction.paid`, writing `CreditTransaction` with idempotency check.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/billing/paddleWebhookValidator.test.ts tests/webhooks/paddleWebhook.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/billing/paddleWebhookValidator.ts src/app/api/webhooks/paddle/route.ts tests/billing/paddleWebhookValidator.test.ts tests/webhooks/paddleWebhook.test.ts
git commit -m "feat: implement cryptographic Paddle webhook verification and credit fulfillment"
```

---

### Task 3: User Authentication & Session Management

**Files:**
- Create: `src/lib/auth/authService.ts`
- Create: `src/app/api/auth/signup/route.ts`
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/session/route.ts`
- Test: `tests/auth/authService.test.ts`
- Test: `tests/api/authRoutes.test.ts`

**Interfaces:**
- Consumes: User email, password, cookies.
- Produces:
  - `hashPassword(password: string): { hash: string; salt: string }`
  - `verifyPassword(password: string, hash: string, salt: string): boolean`
  - `generateSessionToken(userId: string): string`
  - `verifySessionToken(token: string): { userId: string } | null`
  - Routes for signup, login, logout, and session check.

- [ ] **Step 1: Write the failing tests**

```typescript
// tests/auth/authService.test.ts
import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  verifySessionToken,
} from '@/lib/auth/authService';

describe('Auth Service Cryptography', () => {
  it('should hash and verify passwords with salt securely', () => {
    const password = 'SecurePassword123!';
    const { hash, salt } = hashPassword(password);
    expect(hash).toBeDefined();
    expect(salt).toBeDefined();

    expect(verifyPassword(password, hash, salt)).toBe(true);
    expect(verifyPassword('WrongPassword', hash, salt)).toBe(false);
  });

  it('should generate and verify signed session tokens', () => {
    const token = generateSessionToken('user_abc_123');
    const session = verifySessionToken(token);
    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user_abc_123');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/auth/authService.test.ts`
Expected: FAIL with "Cannot find module '@/lib/auth/authService'".

- [ ] **Step 3: Implement auth service and routes**

Implement standard library PBKDF2 password hashing (`crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512')`) and HMAC-signed session tokens. Create API routes for `/api/auth/signup`, `/api/auth/login`, `/api/auth/logout`, and `/api/auth/session` using HTTP-only cookies.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/auth/authService.test.ts tests/api/authRoutes.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/auth/authService.ts src/app/api/auth/ tests/auth/authService.test.ts tests/api/authRoutes.test.ts
git commit -m "feat: implement user authentication, PBKDF2 password hashing, and session management"
```

---

### Task 4: Interactive Pricing Page (`/pricing`)

**Files:**
- Create: `src/app/pricing/page.tsx`
- Test: `tests/pricing/pricingPage.test.ts`

**Interfaces:**
- Consumes: `CREDIT_PACKS`, `APP_CONSTRAINTS.billing`.
- Produces: Interactive pricing page with tier cards (Free Trial, Starter, Pro, Studio), cost calculator, and Paddle checkout trigger.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/pricing/pricingPage.test.ts
import { describe, it, expect } from 'vitest';
import { CREDIT_PACKS } from '@/lib/billing/paddleClient';

describe('Pricing Page Plans', () => {
  it('should present all three PRD credit packages and free tier allowance', () => {
    expect(Object.keys(CREDIT_PACKS)).toEqual(['starter', 'pro', 'studio']);
    expect(CREDIT_PACKS.starter.credits).toBe(50);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/pricing/pricingPage.test.ts`
Expected: PASS (or fail if CREDIT_PACKS not yet imported).

- [ ] **Step 3: Implement `src/app/pricing/page.tsx`**

Build pricing page displaying 1 free run per feature, Starter/Pro/Studio credit cards with price per credit, feature matrix, and FAQ section.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/pricing/pricingPage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/pricing/page.tsx tests/pricing/pricingPage.test.ts
git commit -m "feat: implement interactive pricing page with credit packs and FAQ"
```

---

### Task 5: User Account Dashboard & Authentication Pages

**Files:**
- Create: `src/app/account/login/page.tsx`
- Create: `src/app/account/signup/page.tsx`
- Create: `src/app/account/page.tsx`
- Test: `tests/account/accountPages.test.ts`

**Interfaces:**
- Consumes: Session API, `/api/auth/login`, `/api/auth/signup`, Prisma user credit transactions.
- Produces:
  - Login form at `/account/login`
  - Registration form at `/account/signup`
  - User Dashboard at `/account` displaying email, credit balance badge, transaction ledger, and quick links to "My Projects" and "/pricing".

- [ ] **Step 1: Write the failing test**

```typescript
// tests/account/accountPages.test.ts
import { describe, it, expect } from 'vitest';
import { APP_CONSTRAINTS } from '@/config/constraints';

describe('Account Dashboard Configuration', () => {
  it('should respect initial free credit rules in account initialization', () => {
    expect(APP_CONSTRAINTS.billing.initialFreeCredits).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/account/accountPages.test.ts`
Expected: PASS.

- [ ] **Step 3: Implement `/account`, `/account/login`, and `/account/signup`**

Build clean, accessible forms for signup and login. Build `/account` dashboard showing credit balance, transaction history table (date, amount, reason), and link to buy more credits.

- [ ] **Step 4: Commit**

```bash
git add src/app/account/ tests/account/accountPages.test.ts
git commit -m "feat: implement user account dashboard, login, and registration pages"
```

---

### Task 6: Single VPS Production Deployment Scaffolding

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `Caddyfile`
- Create: `docs/DEPLOYMENT.md`
- Test: `tests/deployment/deploymentConfig.test.ts`

**Interfaces:**
- Produces: Standalone production multi-stage Docker build, Caddy reverse proxy config with automated SSL, and complete VPS deployment playbook.

- [ ] **Step 1: Write the failing test**

```typescript
// tests/deployment/deploymentConfig.test.ts
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Production Deployment Scaffolding', () => {
  it('should provide valid Dockerfile and docker-compose configurations', () => {
    const dockerfile = fs.readFileSync(path.join(process.cwd(), 'Dockerfile'), 'utf-8');
    expect(dockerfile).toContain('FROM node:');
    expect(dockerfile).toContain('npm run build');

    const compose = fs.readFileSync(path.join(process.cwd(), 'docker-compose.yml'), 'utf-8');
    expect(compose).toContain('services:');
    expect(compose).toContain('postgres:');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `./node_modules/.bin/vitest run tests/deployment/deploymentConfig.test.ts`
Expected: FAIL (ENOENT Dockerfile).

- [ ] **Step 3: Implement Dockerfile, docker-compose.yml, Caddyfile, and DEPLOYMENT.md**

Write multi-stage Dockerfile (deps, builder, runner), docker-compose with app, postgres, and caddy, and write `docs/DEPLOYMENT.md` detailing VPS setup on Ubuntu with $6/mo VPS.

- [ ] **Step 4: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/deployment/deploymentConfig.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile docker-compose.yml Caddyfile docs/DEPLOYMENT.md tests/deployment/deploymentConfig.test.ts
git commit -m "feat: add single VPS production deployment scaffolding with Docker and Caddy"
```

---

### Task 7: End-to-End Monetization & Release Suite Verification

**Files:**
- Create: `tests/e2e/monetizationFlow.test.ts`

**Interfaces:**
- Consumes: Auth service, Paddle client, Webhook validator, Entitlement engine.
- Produces: 100% passing test suite across all Phase 1-4 modules and clean Next.js production build.

- [ ] **Step 1: Write the test**

```typescript
// tests/e2e/monetizationFlow.test.ts
import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, generateSessionToken, verifySessionToken } from '@/lib/auth/authService';
import { CREDIT_PACKS, createPaddleCheckoutSession } from '@/lib/billing/paddleClient';
import { generatePaddleWebhookSignature, verifyPaddleWebhookSignature } from '@/lib/billing/paddleWebhookValidator';
import { checkUserEligibility } from '@/lib/billing/entitlement';

describe('Phase 4 Monetization End-to-End Suite', () => {
  it('should successfully chain user auth, credit purchase, webhook verification, and entitlement', async () => {
    // 1. Password hashing
    const { hash, salt } = hashPassword('TestPassword123');
    expect(verifyPassword('TestPassword123', hash, salt)).toBe(true);

    // 2. Session verification
    const token = generateSessionToken('u_test_1');
    expect(verifySessionToken(token)?.userId).toBe('u_test_1');

    // 3. Checkout session
    const checkout = await createPaddleCheckoutSession({ userId: 'u_test_1', packId: 'pro', customerEmail: 'test@domain.com' });
    expect(checkout.success).toBe(true);

    // 4. Webhook signature verification
    const payload = JSON.stringify({ event_type: 'transaction.completed', data: { custom_data: { userId: 'u_test_1', credits: 200 } } });
    const secret = 'pdl_secret_key';
    const sig = generatePaddleWebhookSignature(payload, secret);
    expect(verifyPaddleWebhookSignature(payload, sig, secret)).toBe(true);

    // 5. Entitlement with purchased credits
    const eligibility = checkUserEligibility({
      user: { id: 'u_test_1', creditBalance: 200 },
      toolType: 'PHOTO_BG_REMOVER',
      completedJobsCountForTool: 1, // Free trial already consumed
    });
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.isFreeTrial).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it passes**

Run: `./node_modules/.bin/vitest run tests/e2e/monetizationFlow.test.ts`
Expected: PASS.

- [ ] **Step 3: Run full test suite and verify production build**

Run: `./node_modules/.bin/vitest run`
Expected: All tests pass.
Run: `./node_modules/.bin/next build`
Expected: Production build succeeds with all routes compiled.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/monetizationFlow.test.ts
git commit -m "test: add Phase 4 monetization and release end-to-end integration test suite"
```

