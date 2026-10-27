import { QueryClient, defaultShouldDehydrateQuery, isServer } from "@tanstack/react-query";
import { cache } from "react";

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Bounded retries only (never infinite); calendar data changes rarely.
      // Server prefetches fail fast (the browser retries); browsers retry once.
      queries: { staleTime: 10 * 60 * 1000, retry: isServer ? 0 : 1, refetchOnWindowFocus: false },
      dehydrate: {
        // Only successful queries are sent to the browser; failed server prefetches simply refetch client-side.
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query),
      },
    },
  });
}

// React `cache` scopes one client to a single server request (shared by metadata and page).
const getServerQueryClient = cache(makeQueryClient);
let browserClient: QueryClient | undefined;

/** One client per server request; a single shared client in the browser. */
export function getQueryClient(): QueryClient {
  if (isServer) return getServerQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}
