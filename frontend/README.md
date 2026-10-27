# Khmer Moon Calendar – frontend

Next.js 16 (App Router) + React 19 + TypeScript (strict) + Tailwind CSS 4.

- **i18n:** `next-intl`, routes `/km/*` (default) and `/en/*`. Messages are in `src/messages`. The locale proxy is `src/proxy.ts`.
- **Data:** TanStack Query only. Query factories are in `src/lib/api/query-options.ts`. Server components prefetch and hydrate; client components use the hooks in `src/lib/api/queries.ts`. The fetch wrapper in `src/lib/api/client.ts` adds a 10 s timeout and typed errors.
- **Forms:** React Hook Form + Zod (`src/features/date-converter`).
- **UI:** shadcn/ui-style primitives in `src/components/ui`, the Battambang font (Khmer + Latin) via `next/font`, and design tokens in `src/app/globals.css` (forest green, ivory, muted gold, plus a dark theme).

| Route | Page |
| --- | --- |
| `/[locale]` | Today, monthly calendar, upcoming holidays, quick convert |
| `/[locale]/calendar` | Redirects to the current month |
| `/[locale]/calendar/[year]` | Year view |
| `/[locale]/calendar/[year]/[month]` | Month view (stable URL, kept in sync while navigating) |
| `/[locale]/holidays`, `/[locale]/holidays/[slug]` | Holiday directory and detail |
| `/[locale]/lunar-date` | Converter (`?date=YYYY-MM-DD` converts immediately) |

## Commands

```bash
npm ci
npm run dev          # http://localhost:3000; proxies /api to API_INTERNAL_URL (default http://localhost:8087)
npm run lint
npm run typecheck
npm test             # Vitest + Testing Library
npm run build && npm start
```

Environment variables: `API_INTERNAL_URL` (the backend URL used by the server and the `/api` rewrite) and `NEXT_PUBLIC_SITE_URL` (canonical URLs, sitemap).
