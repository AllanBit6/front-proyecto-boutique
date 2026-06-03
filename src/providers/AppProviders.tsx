import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { type PropsWithChildren, useMemo } from "react"

import { Toaster } from "@/components/ui/sonner"

export function AppProviders({ children }: PropsWithChildren) {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
    []
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster closeButton richColors position="top-right" />
    </QueryClientProvider>
  )
}
