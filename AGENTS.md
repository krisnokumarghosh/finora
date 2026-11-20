# AGENTS.md

## 1. Project Overview

This project is an Advanced Digital Banking Management System built as an assessment project.

The application simulates a digital banking platform with three user roles:
- Admin
- Bank Staff
- Customer

The system supports account management, fund transfers, deposit and withdrawal requests, transaction history, and loan management.

This is a simulated banking application. It must not process real payments or real banking transactions.

## 2. Technology Stack

Use the following technologies:

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **UI Library:** HeroUI
- **Styling:** Tailwind CSS
- **Authentication:** Better Auth
- **Database:** MongoDB
- **State Management:** Redux Toolkit
- **Data Fetching:** RTK Query
- **Charts:** Recharts

Do not introduce additional libraries without a clear reason. Do not add Zod or React Hook Form to the project unless explicitly requested.

## 3. Project Architecture

- Use Next.js App Router.
- Use Next.js Route Handlers for backend API endpoints.
- Keep frontend components separate from business logic.
- Keep database operations and server-side services organized.
- Use reusable components instead of duplicating UI.
- Keep code modular and maintainable without overengineering.
- Use Server Components by default.
- Use Client Components only when interactivity or browser-side state is required.

## 4. Fresher-Friendly Implementation

The developer is a fresher. Keep functionality and implementation understandable for a junior developer.

- Prefer straightforward, readable solutions over unnecessarily advanced patterns.
- Avoid complex architecture, excessive abstractions, design patterns, and premature optimization.
- Do not introduce advanced libraries or techniques when a simpler built-in Next.js, React, TypeScript, or MongoDB approach is sufficient.
- Break complex functionality into small, understandable steps.
- Use clear naming and explain unfamiliar or non-obvious concepts when presenting implementation guidance.
- Do not hide important logic behind unnecessary layers.
- Keep the code maintainable and realistic for a fresher to understand, debug, and explain during an assessment or interview.
- Do not sacrifice security, data integrity, or correctness just to make implementation shorter.

## 5. UI/UX Design Guidelines

The visual design should have the quality and polish of work produced by a senior UI/UX designer, even though the underlying implementation should remain fresher-friendly.

- Create a modern, minimal, premium, and professional banking experience.
- Avoid generic, outdated, or traditional banking website layouts.
- Prioritize strong visual hierarchy, balanced whitespace, consistent spacing, and readable typography.
- Use a consistent design system across public pages and role-based dashboards.
- Use HeroUI components where appropriate and customize them to match the product's visual identity.
- Use subtle, purposeful animations and transitions; avoid excessive motion.
- Build polished cards, tables, forms, navigation, dialogs, and data visualizations.
- Include thoughtful loading, empty, success, and error states.
- Make all pages responsive across mobile, tablet, and desktop.
- Maintain accessibility, including keyboard usability, visible focus states, and sufficient color contrast.

### Color Theme

Use these colors consistently throughout the application:

- **Background:** `#FFFFFF`
- **Primary text:** `#000000`
- **Primary button background:** `#2C2C2C`
- **Primary button text:** `#FFFFFF`
- **Primary button hover background:** `#E6FB2D`
- **Primary button hover text:** `#2C2C2C`

Do not introduce competing brand colors. Neutral supporting colors may be used for borders, muted text, surfaces, and semantic status indicators, while keeping the core theme consistent.

Primary buttons should use the specified default and hover colors. Keep hover transitions smooth and consistent.

## 6. TypeScript Rules

- Use strict TypeScript.
- Avoid `any` whenever possible.
- Define proper types and interfaces.
- Avoid unnecessary type assertions.
- Keep API request and response types consistent.
- Handle nullable and optional values safely.

## 7. State Management Rules

- Use Redux Toolkit for shared client-side state.
- Use RTK Query for API requests, caching, and cache invalidation.
- Do not duplicate RTK Query server data inside regular Redux slices.
- Use typed Redux hooks.
- Do not treat Redux state as the source of truth for financial information.
- The backend and database must remain authoritative.

## 8. Authentication and Authorization

- Use Better Auth for authentication and session management.
- Implement role-based authorization for Admin, Staff, and Customer.
- Always verify authentication and permissions on the server.
- Never rely only on frontend route protection or hidden UI elements.
- Customers must only access their own accounts and transactions.
- Staff must not approve their own loan applications.
- Admin-only operations must be restricted to Admin users.

## 9. Banking and Financial Logic

- Never trust account balances or transaction amounts received from the frontend.
- Always retrieve and validate account balances on the server.
- Validate account ownership, account status, transaction limits, and available balance.
- Prevent duplicate transactions.
- Use atomic database operations for fund transfers.
- Preserve transaction history.
- Record both debit and credit sides of successful transfers.
- Never allow customers to directly update their account balances.
- Do not implement real payment gateway integrations.

## 10. Database Guidelines

- Use MongoDB for application data.
- Reuse a shared MongoDB connection instead of creating unnecessary connections.
- Keep database operations organized.
- Use appropriate indexes for frequently searched fields.
- Validate data on the server before inserting or updating documents.
- Keep Better Auth authentication data separate from banking business data where appropriate.

## 11. Code Quality

- Write clean, readable, and maintainable code.
- Use meaningful variable, function, and component names.
- Keep components focused on a single responsibility.
- Avoid unnecessary abstractions and overengineering.
- Handle errors properly.
- Do not silently ignore errors.
- Avoid unnecessary comments; explain complex business logic when needed.

## 12. Development Workflow

Before implementing a feature:

1. Understand the existing project structure.
2. Review related components, APIs, types, and database models.
3. Follow the existing coding conventions.
4. Explain the proposed approach before making significant architectural changes.
5. Avoid modifying unrelated files.
6. Do not install new dependencies without explaining why.

After implementation:

1. Check TypeScript errors.
2. Check linting issues.
3. Verify loading and error states.
4. Test relevant functionality.
5. Summarize the changes made.

## 13. Important Instructions

- Do not make assumptions about existing code; inspect it first.
- Do not rewrite working code unnecessarily.
- Do not use mock data in production-facing features unless explicitly requested.
- Do not hardcode dashboard analytics; calculate them from actual application data.
- Prioritize security, data consistency, and maintainability over shortcuts.
- If a requirement is unclear, ask before implementing it.
