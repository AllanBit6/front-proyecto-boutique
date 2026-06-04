import { Navigate } from "react-router-dom"

import { LoginForm } from "@/components/login-form"
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

  if (user) {
    return (
      <Navigate
        to={user.firstLogin ? "/reset-password" : getHomePath(user.role)}
        replace
      />
    )
  }

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-background p-4 md:p-8">
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
