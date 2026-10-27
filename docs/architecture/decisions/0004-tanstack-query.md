# ADR 0004 – TanStack Query for all frontend data fetching

**Status:** accepted

All API reads go through query factories in `frontend/src/lib/api/query-options.ts`. Server components prefetch them with a per-request `QueryClient` (`getQueryClient`, scoped with React `cache`) and pass the dehydrated state through `HydrationBoundary`. Client components read the same keys with `useQuery`, so the first render has data and later navigation is cached. Conversions use `useMutation`.

Server prefetches don't retry and failed queries are not dehydrated, so the browser retries once and shows its own error state. Every `fetch` has a 10 s timeout (`AbortSignal.timeout`).
