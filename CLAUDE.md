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
- `app/(dashboard)/` — authenticated area: `/dashboard`, `/bookings`, `/guests`, `/units`, `/requests`, `/reports`, `/users`. Layout and pages are currently stubs.
- `app/page.tsx` redirects `/` → `/login`.
- `app/layout.tsx` is the root: loads fonts (Inter → `--font-sans`, Manrope → `--font-heading`, IBM Plex Sans → `--font-ibm-plex`, Geist Mono → `--font-mono`) and wraps everything in `ThemeProvider` (next-themes, class strategy) → `AuthProvider` → `TooltipProvider`.

### Auth

`lib/providers/auth-provider.tsx` exposes `useAuth()` (`isLoggedIn`, `login`, `logout`). Both actions are `setTimeout` mocks with no real endpoint. Form submit handlers in `components/auth/*-form.tsx` also stub out the network call (`// TODO: call the sign-in endpoint`). There is no route protection for `(dashboard)` yet. `axios`, `@tanstack/react-query`, and `react-hot-toast` are installed but not yet wired up.

### Forms

Pattern used by every auth form: `react-hook-form` + `zodResolver` with schemas in `lib/schemas/auth.ts` (zod v4 — note `z.email()` is top-level, not `z.string().email()`). Types are inferred from schemas (`LoginValues`, etc.). Forms wrap fields in `<fieldset disabled={isSubmitting}>`, surface server errors via `setError("root", ...)`, and use the `AuthField`/`AuthInput`/`AuthLabel` wrappers from `components/auth/auth-field.tsx`, which handle label, error text, and `aria-describedby` ids (`${htmlFor}-error`).

### Styling

- `cn` is the **`cn` npm package**, re-exported from `lib/utils.ts` — not clsx + tailwind-merge. Existing files import it from either `"cn"` or `"@/lib/utils"`.
- Theme tokens live in `app/globals.css`: shadcn oklch variables (`:root` / `.dark`) plus custom hex tokens registered in `@theme inline` as Tailwind colors. Brand colors are `brand-navy`, `brand-azure`, `brand-teal`; neutrals include `porcelain`, `canvas`, `iron`. Use these utility names (e.g. `bg-brand-azure`, `text-iron`) instead of hardcoding hex values.
- Font utilities: `font-sans`, `font-heading`, `font-ibm-plex`, `font-mono`.
- Dark mode uses the `.dark` class via `@custom-variant dark`.

### Path aliases

`@/*` maps to the repo root (`@/components/ui/button`, `@/lib/schemas/auth`, `@/hooks/use-mobile`).
