# TaskForge Web — Auth UI Design Spec

## Overview

Registration, login, and authenticated home page for TaskForge web app. Playful, family-friendly design inspired by Chore Champs-style UIs. Mobile-first responsive layout.

## Tech Stack

- Vite + React 19 + TypeScript
- TailwindCSS (utility-first styling)
- React Router v7 (client-side routing)
- Zustand (auth state management, persisted to localStorage)
- Axios (API client with token refresh interceptor)

## Pages

### Landing Page (`/`)
- Welcome header: "TaskForge" with tagline "Make chores fun & rewarding!"
- Emoji illustration area (kids, chores, stars, rewards)
- Two CTA buttons: "Get Started" (green, links to /register) and "Log In" (outlined blue, links to /login)
- Public route — redirects to /home if already authenticated

### Register Page (`/register`)
- Header: "Create Your Account" with illustration accent
- Form fields: Name, Email, Password (min 8 chars), Confirm Password (client-side match validation)
- Green "Sign Up" submit button
- "Already have an account? Log In" link
- On success: redirect to /login with a success toast/message
- On 409 error: show "Email already registered" inline error
- Public route — redirects to /home if already authenticated

### Login Page (`/login`)
- Header: "Welcome Back!" with illustration accent
- Form fields: Email, Password
- Green "Log In" submit button
- "Don't have an account? Sign Up" link
- On success: store tokens + user in Zustand, redirect to /home
- On 401 error: show "Invalid email or password" inline error
- Public route — redirects to /home if already authenticated

### Home Page (`/home`)
- Header: "Welcome, {name}!" greeting
- User info display (name, role, family status)
- Logout button
- Otherwise blank — placeholder for future dashboard content
- Protected route — redirects to /login if not authenticated

## Layout & Responsiveness

Centered card layout for all pages:
- Mobile (<640px): full-width card with 16px padding, no border radius on outer container
- Tablet (640-1024px): card at max-width 480px, centered, rounded-2xl, subtle shadow
- Desktop (>1024px): same card width, centered vertically and horizontally on gradient background

Shared `Layout` component wraps all pages providing the centered card and background gradient.

## Visual Design

Inspired by the Chore Champs-style mockups:
- **Primary color**: Green (#43a047) — CTAs, success states
- **Accent color**: Blue (#1565c0) — headers, links, secondary buttons
- **Background**: Light gradient (green-to-blue tint, very subtle)
- **Cards**: White, rounded-2xl, shadow-lg on tablet/desktop
- **Buttons**: Rounded-full (pill shape), bold font weight, large padding
- **Typography**: Nunito (Google Font) or system-ui rounded fallback. Bold headings, friendly tone.
- **Illustrations**: Emoji compositions (e.g. 👧🧹⭐🎁👦) — no image assets for MVP
- **Inputs**: Rounded-xl, light gray background (#f1f3f5), focus ring in primary green

## Auth Flow

1. User registers → API `POST /api/auth/register` → redirect to /login
2. User logs in → API `POST /api/auth/login` → store `{ accessToken, refreshToken, user }` in Zustand (persisted to localStorage)
3. Protected pages check Zustand for token → redirect to /login if missing
4. Axios interceptor: on 401 response, attempt `POST /api/auth/refresh` → if success, retry original request; if fail, clear store and redirect to /login
5. Logout → API `POST /api/auth/logout` with refresh token → clear Zustand store → redirect to /

## Project Structure

```
src/
  api/
    client.ts              # Axios instance, base URL from VITE_API_URL, refresh interceptor
    auth.ts                # register(), login(), refresh(), logout() functions
  store/
    auth.ts                # Zustand store: user, tokens, isAuthenticated, login/logout actions
  components/
    Layout.tsx             # Centered card wrapper with background gradient
    ProtectedRoute.tsx     # Checks auth, redirects to /login
    PublicRoute.tsx         # Checks auth, redirects to /home
  pages/
    Landing.tsx            # Welcome page with CTAs
    Register.tsx           # Registration form
    Login.tsx              # Login form
    Home.tsx               # Authenticated blank home
  App.tsx                  # React Router setup with route definitions
  main.tsx                 # Entry point, renders App
```

## API Integration

**Base URL:** Configured via `VITE_API_URL` environment variable, defaults to `http://localhost:3000`.

**Endpoints used:**
- `POST /api/auth/register` — `{ email, password, name }` → `{ id, email, name, role }`
- `POST /api/auth/login` — `{ email, password }` → `{ accessToken, refreshToken, user }`
- `POST /api/auth/refresh` — `{ refreshToken }` → `{ accessToken, refreshToken }`
- `POST /api/auth/logout` — `{ refreshToken }` (requires JWT in Authorization header)

**CORS:** The Fastify server needs `@fastify/cors` registered to allow requests from the web app origin (e.g. `http://localhost:5173` in dev).

## Error Handling

- Form validation errors shown inline below the relevant field
- API errors shown as a banner/toast at the top of the form card
- Loading states: button shows spinner, inputs disabled during submission
- Network errors: "Unable to connect to server" message

## Scope Exclusions

- Child PIN login (separate flow, future work)
- Social auth (Google, Apple, Facebook)
- Password reset / forgot password
- Email verification
- Family setup wizard (handled post-login, future work)
