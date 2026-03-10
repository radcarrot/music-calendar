# Music Calendar (BeatDrop) - Project Rules & Context

This document serves as an integration guide and reference ruleset for the Music Calendar (internally referred to as BeatDrop) application. It details the stack, architecture, core dependencies, and significant problem domains encountered during development.

## 1. Tech Stack & Architecture

The project is a decoupled monolith consisting of a Node.js API backend and a React (Vite) frontend.

### Frontend
- **Framework:** React 19 (via Vite)
- **Routing:** React Router v7
- **Styling:** Tailwind CSS v4 + native CSS Variables for theming
- **State Management:** React hooks + Context (where applicable)
- **HTTP Client:** Axios
- **UI Components:** Lucide-React for icons, Radix UI & Framer Motion for primitives/animations.

### Backend
- **Runtime:** Node.js (ES Modules via `"type": "module"`)
- **Framework:** Express.js + express-validator + express-rate-limit
- **Database:** PostgreSQL (via `pg` raw SQL driver + custom schema management)
- **Authentication:** JWT (Cookies) + Google OAuth 2.0 (`googleapis`) + Spotify API Oauth.
- **Security:** Helmet, CORS (with credentials allowed).
- **Background Jobs:** `node-cron`
- **Password Hashing:** `bcryptjs`

---

## 2. Directory Structure Overview

### Frontend (`/frontend`)
- `/src`
  - `/assets` - Static assets, CSS files.
  - `/components` - Reusable UI elements (Navigation, Event Cards, Modals).
  - `/context` - React Context providers.
  - `/pages` - High-level route views (Dashboard, Login, Register, Artists).
  - `/utils` - Helper functions.
- `vite.config.js` - Configured to proxy `/api` to the backend dev server and explicitly bound to `127.0.0.1`.

### Backend (`/backend`)
- `/src`
  - `/config` - DB connections and constant configurations.
  - `/controllers` - Request handling logic (Auth, Events, Artists, Spotify syncing).
  - `/db` - SQL schema definitions and migrations.
  - `/middleware` - Route protectors (JWT Verify, Error Handlers).
  - `/routes` - API path definitions.
  - `/services` - 3rd party integration logic (Google Calendar).
  - `/utils` - Cryptography and date/time formatting tools.
- `server.js` - Main entry point.

---

## 3. Core Features

1. **Google Calendar Synchronization:** Connects to user's Google Calendar to read existing events, mapping specific event titles (e.g., "Album Drop") to custom colored UI cards.
2. **Spotify Integration:** OAuth flow to connect Spotify, track favorite music artists, and search the Spotify API live via an interactive UI overlay.
3. **Artist Tracking Dashboard:** Displays fetched artists stored in the PostgreSQL database.
4. **Calendar View Modes:** Supports switching between standard Month view, a 7-day Week view, and an Agenda List view.

---

## 4. Key Development Challenges & Issues Faced

### A. OAuth Redirect URI Mismatches (Google & Spotify)
- **Problem:** Frequent `redirect_uri_mismatch` 400 errors during OAuth flows when moving between development servers.
- **Root Cause:** Inconsistencies between `localhost` vs `127.0.0.1`. Spotify strictly flags `localhost` as insecure (even in dev) and behaves better with `127.0.0.1`, while Google expects the exact string registered in the GCP console.
- **Resolution/Rule:** The entire application MUST uniformly use `127.0.0.1`. Hardcoded URLs were extracted out of the application code and moved into `.env` configurations (`FRONTEND_URL`, `BACKEND_URL`, and `VITE_API_URL`).
- **Rule:** When attempting to test locally, developers MUST navigate to `http://127.0.0.1:5173` in their browser, NOT `localhost`.

### B. PostgreSQL Connection Refusals
- **Problem:** Standard Node.js `localhost` database connections failing unexpectedly.
- **Root Cause:** Node 17+ prefers IPv6 (`::1`) for `localhost`, while local PostgreSQL instances often only listen on IPv4.
- **Resolution/Rule:** The `.env` database host (`DB_HOST`) must be explicitly set to the IPv4 address `127.0.0.1` instead of `localhost`.

### C. Cross-Domain Cookie Loss (JWTs & OAuth State)
- **Problem:** Cookies setting successfully on the backend but dropping/disappearing on the frontend redirects, breaking CSRF or authentication checks.
- **Resolution/Rule:** Because the backend and frontend run on different ports, the `cors` middleware must be configured with `credentials: true`. Frontend Axios instances must use `axios.defaults.withCredentials = true;`.

### D. Vite Dev Server Host Binding
- **Problem:** Vite dev server refusing external connections or explicit IP connections like `127.0.0.1`.
- **Resolution/Rule:** The `vite.config.js` server block must include `host: '127.0.0.1'` to explicitly allow the loopback IP rather than solely relying on the alias.

---

## 5. Coding Rules & Constraints

1. **ES Modules Only:** The backend uses `"type": "module"`. Only use `import`/`export` syntax, not `require()`. Keep in mind to include `.js` file extensions in absolute local imports (e.g., `import { db } from './db.js'`).
2. **Absolute URLs:** Do not hardcode domain URLs in UI buttons or API requests. Use `process.env.FRONTEND_URL` / `BACKEND_URL` in Node, and `import.meta.env.VITE_API_URL` in React.
3. **Database Interactions:** Project uses raw `pg` queries. All inputs MUST be parameterized (`$1`, `$2`) to prevent SQL injection. No ORMs are currently used.
4. **Tailwind Styling:** Use standard utility classes. Avoid arbitrary values bracket notation (`w-[325px]`) where standard design system tokens exist. The project utilizes a neon-dark-app visual motif.
5. **No Placeholders:** All UI components should strive to wire up to real or simulated API data rather than leaving static dummy text behind.
