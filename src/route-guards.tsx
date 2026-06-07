import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

import { Skeleton } from "@/components/ui/skeleton"
import type { FeatureRoute } from "@/shared/types/navigation"
import { useAuthStore } from "@/store"

function getHomePath(role: string | null) {
  if (role === "cashier") {
    return "/cajero"
  }

  if (role === "warehouse") {
    return "/inventario"
  }

  return "/dashboard"
}

export function ProtectedRoute() {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const initializeSession = useAuthStore((state) => state.initializeSession)

  useEffect(() => {
    void initializeSession()
  }, [initializeSession])

  if (status === "idle" || status === "checking") {
    return (
      <main className="auth-route-enter grid min-h-svh bg-background md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden border-r bg-sidebar p-4 md:block">
          <Skeleton className="mb-6 h-9 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        </aside>
        <section className="p-4 md:p-6">
          <Skeleton className="mb-6 h-14 w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </section>
      </main>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.firstLogin && location.pathname !== "/reset-password") {
    return <Navigate to="/reset-password" replace />
  }

  return <Outlet />
}

export function RoleProtectedRoute({ route }: { route: FeatureRoute }) {
  const role = useAuthStore((state) => state.role)

  if (!role || !route.allowedRoles.includes(role)) {
    return <Navigate to={getHomePath(role)} replace />
  }

  return route.element
}

export function HomeRedirect() {
  const role = useAuthStore((state) => state.role)

  return <Navigate to={getHomePath(role)} replace />
}
