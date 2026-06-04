import { useEffect } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"

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
      <main className="grid min-h-svh place-items-center bg-background text-sm text-muted-foreground">
        Validando sesion...
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
