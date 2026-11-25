# Finora — Advanced Digital Banking Management System

> A modern, full-stack digital banking platform built as an assessment project, simulating real-world banking operations across three distinct user roles: Admin, Bank Staff, and Customer.

---

## What is Finora?

Finora is a role-based banking management system that replicates the core workflows of a digital bank. It provides a secure, well-structured environment where administrators can oversee the entire platform, bank staff can serve customers and manage banking operations, and customers can manage their own accounts, transfer funds, and apply for loans — all within a polished, premium UI experience.

> **Note:** This is a simulated banking application. It does not process real payments or real banking transactions.

---

## Features

### 👤 Customer

- **Dashboard Overview** — Personalized summary of account balances and recent activity
- **Account Management** — View all personal bank accounts and their details; create new accounts
- **Fund Transfers** — Transfer money between accounts with account lookup and validation
- **Deposits & Withdrawals** — Request deposits and withdrawals with real-time balance updates
- **Transaction History** — Full paginated transaction log with filtering and status indicators
- **Loan Management** — Apply for loans, track application status, and view repayment history

---

### 🏦 Bank Staff

- **Operations Dashboard** — Overview of pending tasks and operational activity
- **Customer Management** — View, search, and register new customers; access full customer profiles
- **Account Management** — View and manage customer bank accounts; open new accounts on behalf of customers
- **Loan Processing** — Review and approve or reject customer loan applications
- **Transaction Oversight** — Monitor all customer transactions with detailed drill-down

---

### 🔐 Admin

- **Analytics Dashboard** — Real-time platform-wide statistics, revenue charts, and growth indicators powered by Recharts
- **Customer Management** — Full visibility into all customers with detailed profile modals and transaction history
- **Bank Account Oversight** — View all accounts across the platform with filtering and detail inspection
- **Loan Administration** — Platform-wide loan oversight with status management
- **Transaction Monitoring** — Complete audit trail of every transaction on the platform

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI Library** | [HeroUI](https://www.heroui.com/) |
| **Styling** | [Tailwind CSS 4](https://tailwindcss.com/) |
| **Authentication** | [Better Auth](https://www.better-auth.com/) |
| **Database** | [MongoDB](https://www.mongodb.com/) |
| **State Management** | [Redux Toolkit](https://redux-toolkit.js.org/) |
| **Data Fetching** | [RTK Query](https://redux-toolkit.js.org/rtk-query/overview) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) + [Gravity UI Icons](https://github.com/gravity-ui/icons) |

---

## Folder Structure

```
finora/
├── public/                         # Static assets
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── (auth)/                 # Auth route group
│   │   │   ├── login/              # Login page
│   │   │   └── register/           # Register page
│   │   ├── (dash)/                 # Dashboard route group
│   │   │   └── dashboard/
│   │   │       ├── admin/          # Admin dashboard pages
│   │   │       ├── bank-staff/     # Staff dashboard pages
│   │   │       ├── customer/       # Customer dashboard pages
│   │   │       ├── layout.tsx      # Shared dashboard layout
│   │   │       └── loading.tsx     # Shared loading state
│   │   ├── (home)/                 # Public landing page
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── api/                    # Next.js Route Handlers (backend)
│   │   │   ├── accounts/           # Account CRUD + lookup
│   │   │   ├── admin/              # Admin-only endpoints
│   │   │   │   ├── accounts/
│   │   │   │   ├── analytics/
│   │   │   │   ├── customers/
│   │   │   │   ├── loans/
│   │   │   │   └── transactions/
│   │   │   ├── auth/               # Better Auth handler
│   │   │   ├── funds/              # Deposit & withdrawal requests
│   │   │   ├── loans/              # Loan applications & repayments
│   │   │   ├── staff/              # Staff-only endpoints
│   │   │   │   ├── accounts/
│   │   │   │   ├── customers/
│   │   │   │   ├── loans/
│   │   │   │   └── transactions/
│   │   │   ├── transactions/       # Transaction history
│   │   │   └── transfers/          # Fund transfers + recent history
│   │   ├── globals.css
│   │   └── layout.tsx              # Root layout
│   │
│   ├── components/                 # React UI components
│   │   ├── authentication/         # Login & Register forms
│   │   ├── dashboard/
│   │   │   ├── admin/              # Admin-specific views & modals
│   │   │   ├── customer/           # Customer-specific views & forms
│   │   │   ├── staff/              # Staff-specific views & modals
│   │   │   ├── DashboardSideBar.tsx
│   │   │   ├── DashboardPageHeader.tsx
│   │   │   └── LogoutConfirmModal.tsx
│   │   └── home/                   # Landing page components (Navbar, Hero)
│   │
│   └── lib/                        # Shared library code
│       ├── auth.ts                 # Better Auth server configuration
│       ├── auth-client.ts          # Better Auth client configuration
│       ├── core/                   # Core server utilities
│       │   ├── authz.ts            # Role-based authorization helpers
│       │   ├── pin.ts              # PIN utilities
│       │   ├── server.ts           # Server-side helpers
│       │   └── session.ts          # Session helpers
│       ├── dataInterface/          # Type definitions & data contracts
│       ├── db/
│       │   └── mongodb.ts          # Shared MongoDB connection
│       ├── redux/                  # Redux store setup
│       │   ├── api.ts              # RTK Query API definitions
│       │   ├── store.ts            # Redux store
│       │   ├── StoreProvider.tsx   # Client-side Redux provider
│       │   └── slices/             # Redux slices
│       ├── server/                 # Server-side service logic
│       │   ├── adminAnalytics.ts   # Analytics aggregations
│       │   └── loanRepayments.ts   # Loan repayment processing
│       └── utils/                  # Shared utility components & helpers
│           ├── Logo.tsx
│           ├── NavIcons.tsx
│           ├── Devices.tsx
│           └── toasts.tsx
│
├── AGENTS.md                       # AI agent guidelines & project rules
├── PRODUCT_REQUIREMENTS.md         # Full product requirements document
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A running MongoDB instance (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/finora.git
cd finora

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your MongoDB URI and Better Auth secret in .env

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
```

---

## User Roles

| Role | Access |
|---|---|
| **Admin** | Full platform oversight — analytics, all customers, all accounts, all loans, all transactions |
| **Bank Staff** | Customer & account management, loan processing, transaction monitoring |
| **Customer** | Own accounts only — transfers, deposits/withdrawals, loan applications, transaction history |

---
