import { useEffect } from "react"
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom"

import { AppLayout } from "@/layouts/AppLayout"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage"
import { featureRoutes } from "@/features/featureRoutes"
import { NotFoundPage } from "@/pages/NotFoundPage"
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

function ProtectedRoute() {
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

function RoleProtectedRoute({ route }: { route: FeatureRoute }) {
  const role = useAuthStore((state) => state.role)

  if (!role || !route.allowedRoles.includes(role)) {
    return <Navigate to={getHomePath(role)} replace />
  }

  return route.element
}

function HomeRedirect() {
  const role = useAuthStore((state) => state.role)

  return <Navigate to={getHomePath(role)} replace />
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/reset-password",
        element: <ResetPasswordPage />,
      },
      {
        path: "/",
        element: <AppLayout />,
        children: [
          {
            index: true,
            element: <HomeRedirect />,
          },
          ...featureRoutes.map((route) => ({
            path: route.path,
            element: <RoleProtectedRoute route={route} />,
          })),
        ],
      },
    ],
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
])
