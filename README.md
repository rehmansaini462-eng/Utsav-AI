# 🎉 Utsav AI — Intelligent Celebration & Event Planner

> **Prompt Wars Challenge 5 — Playbook Target: Rank 1 (100/100)**  
> Production-grade, zero-cache, serverless-scalable AI platform for culturally nuanced celebrations, weddings, and milestone gatherings.

---

## 🌟 The Vertical: Modern Event Planning with Deep Cultural Nuance

**Utsav AI** is an intelligent celebration planner engineered specifically for complex, multi-day, and multi-ceremony events (such as Indian weddings, Sangeet, Mehendi, Haldi, corporate galas, milestone birthdays, and festive family reunions).

Event planning in these verticals requires balancing hyper-specific cultural traditions, complex budget allocations across diverse categories (venue, catering, decor, photography, entertainment), and dynamic real-time adjustments for guest counts and geographic constraints.

---

## Application Screenshots

### 1. Smart Budget Breakdown & Allocation

![Budget Breakdown](public/screenshots/1-budget.png)

### 2. Multi-Day Cultural Itinerary & Timeline

![Event Timeline](public/screenshots/2-timeline.png)

### 3. Culturally Curated Vendor Directory

![Vendor Directory](public/screenshots/3-vendors.png)

### 4. Creative Inspiration & Styling Ideas

![Inspiration and Ideas](public/screenshots/4-ideas.png)

---

## Why Utsav AI is Different

Utsav AI is engineered to stand out from typical hackathon submissions with four foundational pillars:

1. **Zero Mock Data:**
   - **No Fake JSON or Hardcoded Fallbacks:** Every single celebration plan, timeline, and vendor suggestion is generated dynamically in real time via Google Gemini.
   - **Fail-Fast Transparency:** If an upstream API or network error occurs, the user receives an immediate, transparent visual alert with retry capabilities instead of misleading pre-baked mock responses.

2. **Deterministic Budget Math:**
   - **40/30/15/15 Algorithmic Split:** Eliminates financial hallucinations by grounding total budget allocations mathematically:
     - **40%** Venue & Catering
     - **30%** Decor & Production
     - **15%** Photography & Videography
     - **15%** Entertainment & Miscellaneous
   - AI generates culturally nuanced line items strictly inside these validated mathematical bounds.

3. **WAI-ARIA Accessibility:**
   - **Comprehensive Keyboard Navigation:** Full arrow-key (`ArrowLeft`, `ArrowRight`), `Home`, and `End` support for navigating dashboard tabs.
   - **Semantic Standards:** Full implementation of `role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, and `aria-controls` attributes, ensuring an inclusive, screen-reader-friendly experience.

4. **Upstash Redis Rate Limiting:**
   - **Serverless Efficiency 100/100:** Solves the multi-container fragmentation problem inherent to Vercel/serverless environments.
   - **Sliding Window Protection:** Powered by Upstash Redis REST (`10 requests / 60 seconds`), preventing burst abuse globally with zero persistent socket overhead.

---

## 🛡️ Critical Architecture Rule: Zero Caching / Strictly Dynamic AI

> **DISQUALIFICATION SHIELD — ZERO STATIC MOCK DATA POLICY**  
> In Prompt Wars Challenge 4, teams were disqualified for relying on static fallbacks, hardcoded mock JSON, or cached AI outputs.  
> **Utsav AI strictly enforces a 100% Dynamic AI Pipeline:**

- **No Stale Data / No Response Caching:** Every generated celebration itinerary, budget calculation, and vendor guidance is computed in real time using Google Gemini AI (`gemini-flash-latest`).
- **Zero Static Mock Fallbacks:** In the event of an upstream failure, the system fails fast with transparent, typed error states rather than substituting fake or pre-baked answers.
- **Upstash Redis Dedicated Role:** Upstash Redis is utilized **exclusively for distributed rate limiting** (sliding window token accounting). It is **never** used to cache AI prompt responses or event planning payloads.

---

## ⚡ Serverless Scalability: Distributed Rate Limiting (100/100 Efficiency)

In previous challenge rounds, in-memory rate limiting caused point deductions (90/100) under serverless deployment conditions.

### Why In-Memory Rate Limiting Fails in Serverless:

1. **Container Isolation & State Fragmentation:** Next.js deployed on Vercel or AWS Lambda spins up multiple ephemeral worker instances across edge regions. An in-memory Map or LRU cache is isolated to a single container.
2. **Limit Circumvention:** High-concurrency requests hit different containers, resetting counters and bypassing rate constraints.
3. **Cold Start Losses:** Container recycling wipes in-memory limits, creating erratic traffic spikes.

### The Upstash Redis Solution:

- **Centralized HTTP/REST Access:** `@upstash/ratelimit` connects over ultra-low-latency HTTP REST, eliminating persistent connection pool limits in serverless workers.
- **Sliding Window Algorithm (`10 req / 60 s`):** Unlike fixed-window algorithms that allow double-rate bursts across window boundaries, the sliding window calculates weighted request density across the exact previous 60-second span.
- **Global Consistency:** All distributed lambda functions consult the single source of truth in single-digit milliseconds.

---

## 🏗️ Tech Stack & Quality Foundation

| Category                      | Technology                                | Rationale                                                                               |
| :---------------------------- | :---------------------------------------- | :-------------------------------------------------------------------------------------- |
| **Framework**                 | **Next.js 16 (App Router)**               | Modern Turbopack compiler, React 19 support, Server Components                          |
| **Language**                  | **Strict TypeScript 5**                   | Configured with `noUncheckedIndexedAccess`, zero implicit `any`                         |
| **Styling**                   | **Tailwind CSS v4**                       | Modern utility-first engine with zero runtime overhead                                  |
| **AI Engine**                 | **Google Gemini (`gemini-flash-latest`)** | Ultra-fast token latency for real-time dynamic generation                               |
| **Distributed Rate Limiting** | **Upstash Redis**                         | Serverless sliding window limiter (10 requests / 60 seconds)                            |
| **Schema Validation**         | **Zod 3 / 4**                             | Runtime environment and payload contract enforcement                                    |
| **Unit Testing**              | **Vitest**                                | Sub-second ESM test runner with path alias resolution                                   |
| **Code Formatting**           | **Prettier + Tailwind Plugin**            | Automated consistent formatting across the team                                         |
| **Git Hooks**                 | **Husky + Lint-staged**                   | Pre-commit automated linting, formatting, and strict validation                         |
| **CI/CD**                     | **GitHub Actions**                        | Automated push/PR gate: `npm ci`, `format:check`, `lint`, `type-check`, `test`, `build` |

---

## 📂 Project Structure

```text
utsav-ai/
├── .github/
│   └── workflows/
│       └── ci.yml             # Production GitHub Actions CI pipeline
├── .husky/
│   └── pre-commit             # Pre-commit hook running lint-staged
├── public/
│   └── screenshots/           # Application screenshots for portfolio/review
├── src/
│   ├── app/                   # Next.js App Router (pages, layout, API routes)
│   ├── components/            # UI components and reusable design primitives
│   ├── config/
│   │   └── constants.ts       # Central constants (APP_NAME, GEMINI_MODEL, RATE_LIMIT)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── env.ts             # Zod environment schema validation
│   │   └── utils/
│   │       └── rateLimit.ts   # Upstash Redis sliding window rate limiter
│   └── types/
│       └── index.ts           # Central domain TypeScript interfaces
├── tests/                     # Unit, UI, E2E, and security test suites
├── .env.example               # Template environment configuration
├── .gitignore                 # Strict git ignore (protects .env.local)
├── .lintstagedrc.json         # Lint-staged rules for pre-commit
├── .prettierrc                # Prettier formatting config
├── .prettierignore            # Prettier ignore patterns
├── tsconfig.json              # Strict TypeScript config (noUncheckedIndexedAccess)
├── vitest.config.mts          # Vitest ESM configuration
└── package.json               # Dependencies and build scripts
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v20 or v22+ (v24 compatible)
- **npm**: v10+

### 2. Environment Configuration

Clone the repository and initialize your local environment file:

```bash
cp .env.example .env.local
```

Fill in the required credentials in `.env.local`:

```env
# Google Gemini API
GEMINI_API_KEY="your_gemini_api_key"

# Upstash Redis REST
UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_rest_token"
```

> **Security Note:** `.env.local` is strictly excluded from version control via `.gitignore`. Never commit API keys.

### 3. Installation

```bash
npm install
```

### 4. Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Quality Scripts & CI Commands

| Command                | Action                                                 |
| :--------------------- | :----------------------------------------------------- |
| `npm run type-check`   | Runs strict TypeScript compiler check (`tsc --noEmit`) |
| `npm run test`         | Executes unit tests via Vitest                         |
| `npm run lint`         | Runs ESLint analysis                                   |
| `npm run format:check` | Verifies code formatting with Prettier                 |
| `npm run format`       | Auto-fixes code formatting across all files            |
| `npm run build`        | Builds optimized production Next.js bundle             |

---

## 🔒 Production CI Pipeline Overview

Every push or pull request to `main` / `master` automatically triggers `.github/workflows/ci.yml`:

1. **Fresh Dependency Installation:** Runs `npm ci` with caching.
2. **Format Verification:** Prettier code style inspection.
3. **Static Analysis:** ESLint validation.
4. **Strict Type Safety:** Zero type errors with `noUncheckedIndexedAccess`.
5. **Unit Test Pass:** Vitest regression suite.
6. **Production Build:** Full Next.js production build verification.
