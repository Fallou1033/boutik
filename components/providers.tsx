"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

/**
 * Providers — Wrap global providers here.
 * React Query est configuré avec des valeurs optimisées pour mobile (staleTime élevé).
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime:  60 * 1000,       // 1 minute avant re-fetch
            gcTime:     5 * 60 * 1000,   // 5 minutes en cache
            retry:      2,               // 2 tentatives en cas d'erreur réseau (3G)
            refetchOnWindowFocus: false, // Évite les re-fetches inutiles sur mobile
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
