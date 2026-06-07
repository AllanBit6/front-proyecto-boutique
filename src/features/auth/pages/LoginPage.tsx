import { useEffect } from "react"
import { Navigate } from "react-router-dom"

import { LoginForm } from "@/components/login-form"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuthStore } from "@/store"
import type { Role } from "@/shared/types/domain"

function getHomePath(role: Role) {
  if (role === "cashier") {
    return "/cajero"
  }

  if (role === "warehouse") {
    return "/inventario"
  }

  return "/dashboard"
}

export function LoginPage() {
  const user = useAuthStore((state) => state.user)
  const status = useAuthStore((state) => state.status)
  const initializeSession = useAuthStore((state) => state.initializeSession)

  useEffect(() => {
    void initializeSession()
  }, [initializeSession])

  if (status === "idle" || status === "checking") {
    return (
      <main className="auth-route-enter grid min-h-svh place-items-center bg-background p-4">
        <div className="w-full max-w-[420px] space-y-4">
          <Skeleton className="mx-auto h-7 w-36" />
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (user) {
    return (
      <Navigate
        to={user.firstLogin ? "/reset-password" : getHomePath(user.role)}
        replace
      />
    )
  }

  return (
    <main className="auth-route-enter relative grid min-h-svh place-items-center overflow-hidden bg-background p-4 md:p-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_18%,color-mix(in_oklch,var(--primary),transparent_78%),transparent_34%),linear-gradient(135deg,color-mix(in_oklch,var(--background),var(--primary)_5%),var(--background)_46%,color-mix(in_oklch,var(--background),var(--accent)_8%))]" />
      <div className="w-full max-w-[420px] space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-normal">
            Boutique POS
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Acceso para ventas, inventario y caja.
          </p>
        </div>
        <LoginForm className="w-full" />
      </div>
    </main>
  )
}
