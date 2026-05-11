# Angular 21 Auth Boilerplate — Krist Dave Ferrer's Full-Stack Authentication

This project is an **Angular 21 authentication boilerplate** created by **Krist Dave Ferrer**. It demonstrates a complete authentication flow with both a **live backend API** and a built-in **fake backend** for offline development.

### Features

- Email sign up + email verification
- Login + logout
- JWT auth header for API requests
- Refresh tokens (cookie-based) + auto-refresh before access token expiryV
- Forgot password + reset password
- Role-based authorization (User & Admin)
- Admin area for account management
- Profile area for viewing/updating your own account

## Table of contents

- [1) Prerequisites](#1-prerequisites)
- [2) Run the app (real API — deployed backend)](#2-run-the-app-real-api--deployed-backend)
- [3) Run the app (real API — local backend)](#3-run-the-app-real-api--local-backend)
- [4) Run the app (fake backend, no API)](#4-run-the-app-fake-backend-no-api)
- [5) Using the app (what to click)](#5-using-the-app-what-to-click)
- [6) How authentication works](#6-how-authentication-works)
- [7) Authorization (roles + route guards)](#7-authorization-roles--route-guards)
- [8) Project structure (quick tour)](#8-project-structure-quick-tour)
- [9) Troubleshooting](#9-troubleshooting)

## 1) Prerequisites

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm (comes with Node.js)
- (Optional) Angular CLI:
  ```bash
  npm i -g @angular/cli
  ```

## 2) Run the app (real API — deployed backend)

The project is pre-configured to call a **live backend API** at:

- `https://final-project-backend-n1y3.onrender.com` (see `src/environments/environment.prod.ts`)

### Step 1: install packages

From the project root (where `package.json` is):

```bash
npm install
```

### Step 2: start Angular

```bash
npm start
```

This runs `ng serve` and starts the dev server at `http://localhost:4200/`.

The app will automatically call the deployed backend — no separate API setup needed.

## 3) Run the app (real API — local backend)

If you want to run the backend locally instead of using the deployed one:

### Step 1: install packages

```bash
npm install
```

### Step 2: start your local backend API

Start an API that implements the `/accounts/*` endpoints described in [How authentication works](#6-how-authentication-works).

The frontend expects the API to be available at `http://localhost:4000` by default.

### Step 3: start Angular

```bash
npm start
```

### Step 4: update API URL (if your API runs elsewhere)

Edit the environment file:

- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production build)

Update:

```ts
apiUrl: 'http://localhost:4000'
```

## 4) Run the app (fake backend, no API)

If you want to run everything fully in the browser **without any backend**, you can enable the built-in fake backend interceptor.

### Step 1: enable the fake backend provider

Open `src/app/app-module.ts` and **uncomment** the `fakeBackendProvider` line in the `providers` array.

It should look like this:

```ts
    providers: [
        { provide: APP_INITIALIZER, useFactory: appInitializer, multi: true, deps: [AccountService] },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },

        // provider used to create fake backend
        fakeBackendProvider
    ],
```

### Step 2: run the app

```bash
npm install
npm start
```

### How the fake backend behaves (important for beginners)

- Accounts are stored in your browser's **localStorage**, not in a database.
- "Emails" (verification + reset password links) are displayed **as Bootstrap info alerts on the page** with clickable HTML links — since a browser-only app can't send real emails.
- The **first registered account** automatically becomes `Admin`. All subsequent accounts become `User`.

If you want a clean slate while using the fake backend, clear site data in your browser or remove the local storage key:

- `angular-21-auth-boilerplate-accounts`

## 5) Using the app (what to click)

This section assumes you are starting fresh and want to see the full authentication flow.

### A) Create an account

1. Go to **Register**
2. Fill in your details and submit
3. If using the **fake backend**, a "verification email" will appear as a **Bootstrap info alert** at the top of the page with a clickable verification link
4. Click the link in the alert (or copy and paste it into your browser) to verify your account

### B) Login

1. Go to **Login**
2. Enter your email + password
3. On success you'll be redirected to the home page

### C) Forgot password + reset password

1. Go to **Forgot Password**
2. Enter your email and submit
3. If using the **fake backend**, a "reset password email" will appear as a **Bootstrap info alert** at the top of the page with a clickable reset link
4. Click the link in the alert (or copy and paste it into your browser) to set a new password

### D) Profile and Admin areas

- **Profile** pages allow you to view and update your own account details
- The **Admin** area is restricted to accounts with the `Admin` role

## 6) How authentication works

This boilerplate uses **two tokens**:

- **Access token (JWT):** short-lived token used in the `Authorization: Bearer <token>` header
- **Refresh token:** long-lived token stored in a cookie and sent with `withCredentials: true`

### The important pieces

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | API base URL configuration |
| `src/app/_services/account.service.ts` | Login, logout, refresh, register, and CRUD operations |
| `src/app/_helpers/app.initializer.ts` | Tries to refresh session on first app load |
| `src/app/_helpers/jwt.interceptor.ts` | Adds the `Authorization: Bearer` header to API calls |
| `src/app/_helpers/error.interceptor.ts` | Auto-logout on 401 / 403 responses |

### Flow: login

1. Login component calls `AccountService.login(email, password)`
2. The API returns an `Account` object that includes a `jwtToken`
3. The app stores the account in memory (a `BehaviorSubject`) and starts a refresh timer
4. For future API requests, the JWT interceptor attaches `Authorization: Bearer <token>`

### Flow: refresh token (important)

1. The refresh token is sent to the API using cookies (`withCredentials: true`)
2. The API responds with a new access token (`jwtToken`)
3. The app schedules an automatic refresh **about 1 minute before** the access token expires
4. When you reload the page, `APP_INITIALIZER` calls refresh immediately to restore the session (if the cookie is still valid)

### Expected API endpoints

The frontend calls these endpoints (base URL is `environment.apiUrl`):

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts/authenticate` | Login |
| POST | `/accounts/refresh-token` | Refresh access token |
| POST | `/accounts/revoke-token` | Revoke refresh token (logout) |
| POST | `/accounts/register` | Register new account |
| POST | `/accounts/verify-email` | Verify email address |
| POST | `/accounts/forgot-password` | Request password reset |
| POST | `/accounts/validate-reset-token` | Validate reset token |
| POST | `/accounts/reset-password` | Reset password |
| GET | `/accounts` | List all accounts (Admin only) |
| GET | `/accounts/:id` | Get account by ID |
| POST | `/accounts` | Create account (Admin) |
| PUT | `/accounts/:id` | Update account |
| DELETE | `/accounts/:id` | Delete account |

## 7) Authorization (roles + route guards)

Routes are protected with `AuthGuard`:

- If you are **not logged in**, you are redirected to `/account/login`
- If you are **logged in but don't have the required role**, you are redirected to `/`

Role restrictions are applied using route data. For example:

- `/admin` requires `Role.Admin`

### Key files

| File | Purpose |
|------|---------|
| `src/app/_helpers/auth.guard.ts` | Route guard that checks authentication + roles |
| `src/app/_models/role.ts` | `Role` enum (`User`, `Admin`) |
| `src/app/app-routing-module.ts` | Top-level route definitions |

## 8) Project structure (quick tour)

Most code lives under `src/app/`:

| Directory | Contents |
|-----------|----------|
| `_services/` | Shared services (`AccountService`, `AlertService`) |
| `_helpers/` | Cross-cutting helpers (guards, interceptors, app initializer, fake backend, validators) |
| `_models/` | Shared types and enums (`Account`, `Role`, `Alert`) |
| `_components/` | Shared UI components (`AlertComponent`) |
| `account/` | Auth screens (login, register, verify email, forgot password, reset password) |
| `profile/` | User profile screens (view details + update) |
| `admin/` | Admin-only screens (account management overview) |
| `home/` | Home page (landing after login) |

The UI is styled with **Bootstrap 5** (via npm package) and **Less** (`.less` files).

Environment configuration is in `src/environments/`:

- `environment.ts` — development settings (default API: `http://localhost:4000`)
- `environment.prod.ts` — production settings (deployed API: `https://final-project-backend-n1y3.onrender.com`)

## 9) Troubleshooting

### The app redirects me back to login after refresh

- If using a **real API**, make sure it sets a refresh token cookie and supports `POST /accounts/refresh-token`.
- If your API runs on a different origin (different hostname/port), you must configure CORS to allow credentials and ensure cookies are set with correct `SameSite` / `Secure` settings.
- If using the **deployed backend**, check that the backend is running and accessible.

### I'm calling an API on another port and cookies aren't being sent

This frontend uses `withCredentials: true` for login / refresh / revoke, but the backend must also:

- Enable CORS with credentials
- Return `Access-Control-Allow-Credentials: true`
- Allow the frontend origin in `Access-Control-Allow-Origin` (it cannot be `*` when using credentials)

### I want to reset the fake backend data

- Clear browser storage for the site, or remove the local storage key:
  - `angular-21-auth-boilerplate-accounts`

### Run unit tests

```bash
npm test
```

This project uses **Vitest** for unit testing.

### Production build

```bash
npm run build
```

This compiles the project with the production configuration and stores the build artifacts in the `dist/` directory.