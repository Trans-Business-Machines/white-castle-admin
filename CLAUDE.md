# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Staff admin dashboard for White Castle Motel (Eldoret). Next.js 16 App Router, React 19, TypeScript (strict), Tailwind CSS v4, shadcn/ui (`radix-vega` style, `radix-ui` package). No backend exists yet — auth and data are mocked in-app.

## Next.js version warning

This is **Next.js 16**, which has breaking changes from earlier versions (see [AGENTS.md](AGENTS.md)). Before writing framework-facing code (routing, caching, data fetching, proxy/middleware, metadata), read the relevant guide under `node_modules/next/dist/docs/01-app/` rather than relying on prior knowledge.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run lint         # eslint (flat config: next/core-web-vitals + next/typescript)
npm run typecheck    # tsc --noEmit
npm run format       # prettier --write on all .ts/.tsx
npx shadcn@latest add <component>   # adds to components/ui/
```

There is no test runner configured.

Prettier is configured with **no semicolons**, double quotes, 80 cols, and `prettier-plugin-tailwindcss` (sorts classes in `cn()`/`cva()` and JSX). Run `npm run format` before committing so diffs stay clean.

## Architecture

### Route groups

- `app/(auth)/` — public screens: `/login`, `/forgot-password`, `/reset-password`. Its layout renders the branded split panel (gradient aside + centered form column). Pages are thin: they set `metadata.title` and compose `AuthPanel` + a form component.
- `app/(dashboard)/` — authenticated area: `/dashboard`, `/bookings`, `/guests`, `/units`, `/requests`, `/reports`, `/users`, `/profile`. Most pages are stubs; `/profile` renders `components/profile/profile-view.tsx` (account details, change-password dialog, sign out).
- `app/page.tsx` redirects `/` → `/login`.
- `app/layout.tsx` is the root: loads fonts (Inter → `--font-sans`, Manrope → `--font-heading`, IBM Plex Sans → `--font-ibm-plex`, Geist Mono → `--font-mono`) and wraps everything in `ThemeProvider` (next-themes, class strategy) → `AuthProvider` → `TooltipProvider`.

### Auth

The backend is a FastAPI-style API (errors come back as `{ detail: string | ValidationError[] }`; use `getApiErrorMessage` from `lib/api/errors.ts`).

- **The browser never calls the backend origin directly.** `next.config.ts` rewrites `/api/:path*` to `API_PROXY_TARGET` (server-only env), and `NEXT_PUBLIC_API_BASE` is `/api`. This keeps the refresh cookie same-site: the backend sets it `SameSite=Lax` without `Secure`, so a cross-site call from `localhost` would never store or send it and every reload would land on `/login`. See `.env.example`. Restart `npm run dev` after editing `.env`.

- **Token model:** the access token lives only in memory (`lib/auth-token.ts`); the refresh token is an HTTP-only cookie set by the server. Nothing auth-related is written to localStorage.
- `lib/axios.ts` exports `axiosInstance` (baseURL + `withCredentials`). Its request interceptor injects `Authorization: Bearer`, and its response interceptor refreshes once on a 401 (`POST /auth/refresh`, deduped across concurrent failures) and replays the request. If the refresh fails it fires `onUnauthorized` listeners. Use this instance for every authenticated call.
- `lib/api/auth.ts` wraps the auth endpoints. `login`, `requestPasswordReset` (`/auth/password-reset`), and `confirmPasswordReset` (`/auth/password-reset/confirm`) use bare `axios` so interceptors never touch them; `fetchMe` (`/auth/me`), `logout`, and `changePassword` (`PATCH /auth/change-password`) use `axiosInstance`.
- `providers/auth-provider.tsx` exposes `useAuth()` (`user`, `accessToken`, `status`, `isLoggedIn`, `login`, `logout`). On mount it refreshes, fetches `/auth/me`, then routes: signed-in visitors on `/` or a public auth route go to `/dashboard`; failures on a protected route go to `/login`. While that runs it renders `WorkspaceLoader` instead of the app. `isPublicRoute()` is the single source of truth for public paths.
- `components/auth/require-auth.tsx` wraps the `(dashboard)` layout and bounces unauthenticated users to `/login`.
- Two account menus share one popover pattern: `components/dashboard/sidebar-user.tsx` (sidebar footer, name + role, gradient popover) and `components/dashboard/header-user.tsx` (header, name + email, porcelain popover, avatar-only under `sm`). Both use the `useLogout()` hook (`hooks/use-logout.ts`) and `getInitials()` from `lib/format.ts`; reuse those rather than re-implementing sign-out or initials.
- `@tanstack/react-query` is provided (`providers/query-client.tsx`) but no queries exist yet; `react-hot-toast` is mounted once via `components/app-toaster.tsx` in the root layout; call `toast.success(...)` etc. from anywhere.

### Forms

Pattern used by every auth form: `react-hook-form` + `zodResolver` with schemas in `lib/schemas/auth.ts` (zod v4 — note `z.email()` is top-level, not `z.string().email()`). Types are inferred from schemas (`LoginValues`, etc.). Forms wrap fields in `<fieldset disabled={isSubmitting}>`, surface server errors via `setError("root", ...)`, and use the `AuthField`/`AuthInput`/`AuthLabel` wrappers from `components/auth/auth-field.tsx`, which handle label, error text, and `aria-describedby` ids (`${htmlFor}-error`).

### Styling

- `cn` is the **`cn` npm package**, re-exported from `lib/utils.ts` — not clsx + tailwind-merge. Existing files import it from either `"cn"` or `"@/lib/utils"`.
- Theme tokens live in `app/globals.css`: shadcn oklch variables (`:root` / `.dark`) plus custom hex tokens registered in `@theme inline` as Tailwind colors. Brand colors are `brand-navy`, `brand-azure`, `brand-teal`; neutrals include `porcelain`, `canvas`, `iron`. Use these utility names (e.g. `bg-brand-azure`, `text-iron`) instead of hardcoding hex values.
- Font utilities: `font-sans`, `font-heading`, `font-ibm-plex`, `font-mono`.
- Dark mode uses the `.dark` class via `@custom-variant dark`.

### Path aliases

`@/*` maps to the repo root (`@/components/ui/button`, `@/lib/schemas/auth`, `@/hooks/use-mobile`).
