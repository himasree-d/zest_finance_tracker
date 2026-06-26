# Zest — Personal Finance Tracker

> A full-stack personal finance web app for tracking transactions, budgets, savings goals, recurring bills, and AI-powered spending insights.

**Live Demo:** [zest-finance-tracker.vercel.app](https://zest-finance-tracker.vercel.app)  
**Demo credentials:** `alex@zest.app` / `Password1`

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Variables](#environment-variables)
  - [Installation](#installation)
  - [Seeding the Database](#seeding-the-database)
- [API Reference](#api-reference)
- [Deployment](#deployment)
- [Security](#security)

---

## Features

**Dashboard**
- Net worth overview with month-over-month change
- Income vs. expenses bar chart (last 6 months)
- Category spending breakdown (donut chart)
- Budget health cards, upcoming bills, and savings progress at a glance

**Transactions**
- Add income or expense transactions with category, merchant, date, and notes
- Attach a transaction to a budget
- Full-text search, filter by category/type/date range/amount range
- Sortable, paginated table with CSV export

**Budgets**
- Create monthly budgets per category with custom colour and emoji icon
- Optional rollover of unspent balance to next month
- Real-time spent vs. limit progress bars

**Savings Pots**
- Named savings goals with target amount and optional target date
- Add or withdraw funds with per-pot transaction history
- Colour-coded progress towards goal

**Recurring Bills**
- Track weekly / monthly / yearly bills
- Auto-computed status: `PAID`, `DUE_SOON`, `OVERDUE`, `UPCOMING`
- Days-until-due countdown

**AI Insights** *(powered by Groq + Llama 3.3 70B)*
- LLM-generated monthly financial summary
- Anomaly detection — flags categories where spend is >50% above 3-month average
- Personalised saving suggestions and budget streak tracking
- Graceful fallback to static mock insights when API key is absent

**Notifications**
- System notifications for bill due dates, budget alerts, pot goal completions

**Settings**
- Currency selector: USD, INR, EUR, GBP
- Light / dark / system theme toggle
- Email notification preference

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build tool | Vite 8 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| State management | Zustand v5 |
| Forms + validation | React Hook Form + Zod v4 |
| Charts | Recharts |
| HTTP client | Axios |
| Date utilities | date-fns |
| CSV parsing | PapaParse |
| Icons | Lucide React |
| Toast notifications | react-hot-toast |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express 4 + TypeScript 5 |
| Database | MongoDB via Mongoose 9 |
| ORM schema reference | Prisma (schema only, not used at runtime) |
| Authentication | JWT (httpOnly cookies) — access token 15m, refresh token 7d |
| Password hashing | bcrypt (12 salt rounds) |
| AI | Groq SDK — Llama 3.3 70B Versatile |
| Validation | Zod |
| Rate limiting | express-rate-limit |

---

## Architecture

```
Browser
  │
  ├── React SPA (Vercel)
  │     ├── Zustand stores (authStore, notificationStore, settingsStore)
  │     ├── Feature modules (auth, dashboard, transactions, budgets,
  │     │   savings, bills, insights, notifications, settings)
  │     └── Axios → API calls (credentials: 'include')
  │
  └── Express REST API (Render)
        ├── JWT auth middleware (httpOnly cookie)
        ├── Route handlers → Controllers → Mongoose models
        ├── Groq AI (insights endpoint)
        └── MongoDB Atlas (cluster: zest db)
```

**Auth flow:**
1. `POST /api/auth/login` → sets `access_token` (15m) and `refresh_token` (7d) as `httpOnly` cookies
2. All protected routes verify `access_token` from cookie
3. `POST /api/auth/refresh` rotates both tokens (refresh token rotation pattern)
4. Refresh tokens are persisted in MongoDB and invalidated on use or logout

---

## Project Structure

```
root/
├── client/                  # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/      # Recharts wrappers
│   │   │   ├── layout/      # AppLayout, sidebar, navbar
│   │   │   └── ui/          # Shared UI primitives
│   │   ├── features/
│   │   │   ├── auth/        # LoginPage, RegisterPage
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── budgets/
│   │   │   ├── savings/
│   │   │   ├── bills/
│   │   │   ├── insights/
│   │   │   ├── notifications/
│   │   │   └── settings/
│   │   ├── hooks/
│   │   ├── lib/
│   │   │   └── api.ts       # Axios instance + typed API methods
│   │   ├── store/
│   │   │   ├── authStore.ts
│   │   │   ├── notificationStore.ts
│   │   │   └── settingsStore.ts
│   │   ├── types/
│   │   │   └── index.ts     # All shared TypeScript interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
└── server/                  # Express backend
    ├── src/
    │   ├── controllers/     # authController, transactionsController, ...
    │   ├── middleware/
    │   │   ├── authenticate.ts
    │   │   └── errorHandler.ts
    │   ├── models/          # Mongoose schemas
    │   │   ├── User.ts
    │   │   ├── Transaction.ts
    │   │   ├── Budget.ts
    │   │   ├── SavingsPot.ts
    │   │   ├── RecurringBill.ts
    │   │   ├── Notification.ts
    │   │   └── RefreshToken.ts
    │   ├── routes/          # Express routers
    │   ├── lib/
    │   │   ├── db.ts        # MongoDB connection
    │   │   └── schemas.ts   # Zod request schemas
    │   └── index.ts         # App entry point
    ├── scripts/
    │   └── seed.ts          # Database seed script
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas cluster (or local MongoDB)
- (Optional) Groq API key for live AI insights

### Environment Variables

**Server — `server/.env`**

```env
PORT=3001
NODE_ENV=development

MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

JWT_ACCESS_SECRET=your_access_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here

GROQ_API_KEY=your_groq_api_key_here   # optional — falls back to mock insights if omitted
```

**Client — `client/.env`**

```env
VITE_API_URL=http://localhost:3001/api
```

> In production, set `VITE_API_URL` to your deployed API URL (no trailing slash).

### Installation

```bash
# Clone the repo
git clone https://github.com/<your-username>/zest.git
cd zest

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

**Run in development:**

```bash
# Terminal 1 — start the API server
cd server
npm run dev

# Terminal 2 — start the Vite dev server
cd client
npm run dev
```

Client runs at `http://localhost:5173`, server at `http://localhost:3001`.

**Build for production:**

```bash
# Build server
cd server && npm run build

# Build client
cd client && npm run build
```

### Seeding the Database

The repo includes a seed script that populates a demo user (`alex@zest.app / Password1`) with realistic transaction history, budgets, savings pots, recurring bills, and notifications:

```bash
cd server
npm run mongo:seed
```

---

## API Reference

All routes are prefixed with `/api`. Protected routes require the `access_token` httpOnly cookie.

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | ✗ | Register a new user. Rate limited: 10/hr |
| POST | `/login` | ✗ | Login and receive auth cookies. Rate limited: 5 per 15min |
| POST | `/refresh` | ✗ | Rotate access + refresh tokens |
| POST | `/logout` | ✓ | Invalidate refresh token and clear cookies |
| GET | `/me` | ✓ | Get current authenticated user |

### Dashboard — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | Aggregated dashboard data: net worth, income/expenses, category spending, budget health, recent transactions, upcoming bills, savings progress |

### Transactions — `/api/transactions`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List transactions with filters: `search`, `category`, `type`, `dateFrom`, `dateTo`, `amountMin`, `amountMax`, `sortBy`, `sortOrder`, `page`, `pageSize` |
| POST | `/` | ✓ | Create a transaction |
| PUT | `/:id` | ✓ | Update a transaction |
| DELETE | `/:id` | ✓ | Delete a transaction |

### Budgets — `/api/budgets`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List budgets with current month spend |
| POST | `/` | ✓ | Create a budget |
| PUT | `/:id` | ✓ | Update a budget |
| DELETE | `/:id` | ✓ | Delete a budget |

### Savings — `/api/savings`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List savings pots |
| POST | `/` | ✓ | Create a pot |
| PUT | `/:id` | ✓ | Update a pot |
| DELETE | `/:id` | ✓ | Delete a pot |
| POST | `/:id/transactions` | ✓ | Add or withdraw funds from a pot |

### Bills — `/api/bills`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List recurring bills with computed status |
| POST | `/` | ✓ | Create a bill |
| PUT | `/:id` | ✓ | Update a bill |
| DELETE | `/:id` | ✓ | Delete a bill |

### Insights — `/api/insights`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | AI-generated spending analysis via Groq (Llama 3.3 70B). Falls back to mock data if `GROQ_API_KEY` is not set |

### Notifications — `/api/notifications`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | List all notifications |
| PATCH | `/:id/read` | ✓ | Mark a notification as read |
| DELETE | `/:id` | ✓ | Delete a notification |

### Settings — `/api/settings`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | ✓ | Get user settings |
| PUT | `/` | ✓ | Update currency, theme, email notification preference |

### Health

```
GET /health  →  { status: "ok", timestamp: "..." }
```

---

## Deployment

This project follows a split deployment pattern: backend on Render, frontend on Vercel.

**Backend (Render — Web Service)**

1. Set root directory to `server/`
2. Build command: `npm install && npm run build`
3. Start command: `node dist/index.js`
4. Add environment variables: `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `GROQ_API_KEY`, `NODE_ENV=production`

**Frontend (Vercel)**

1. Set root directory to `client/`
2. Build command: `npm run build`
3. Output directory: `dist`
4. Add environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com` (no trailing slash)

> CORS is configured with `origin: true, credentials: true` on the server — for production, lock this down to your Vercel domain.

---

## Security

- Passwords hashed with bcrypt at 12 salt rounds
- JWTs transmitted exclusively via `httpOnly`, `secure`, `sameSite` cookies — never exposed to JavaScript
- Refresh token rotation: every `/refresh` call invalidates the old token and issues a new pair
- Auth and registration endpoints are rate-limited to prevent brute-force
- Input validation with Zod on all incoming request bodies
- User data is fully isolated — all queries are scoped to the authenticated `userId`
