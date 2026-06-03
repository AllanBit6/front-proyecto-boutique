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
    <main className="relative grid min-h-svh overflow-hidden bg-background p-4 md:p-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_18%,color-mix(in_oklch,var(--primary),transparent_72%),transparent_32%),radial-gradient(circle_at_85%_12%,color-mix(in_oklch,var(--accent),transparent_60%),transparent_30%),linear-gradient(135deg,color-mix(in_oklch,var(--background),var(--primary)_7%),var(--background)_42%,color-mix(in_oklch,var(--background),var(--accent)_10%))]" />
      <div className="mx-auto grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="hidden space-y-5 lg:block">
          <div className="inline-flex items-center rounded-full border bg-card/75 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
            Boutique POS
          </div>
          <div className="max-w-xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-normal text-foreground">
              Venta e inventario listos para atender.
            </h1>
            <p className="text-base leading-7 text-muted-foreground">
              Accede a un espacio simple para vender, revisar stock y mantener
              la tienda al dia sin pantallas innecesarias.
            </p>
          </div>
          <div className="grid max-w-lg grid-cols-3 gap-3">
            <div className="rounded-lg border bg-card/80 p-3 shadow-sm backdrop-blur">
              <div className="text-lg font-semibold">POS</div>
              <div className="text-xs text-muted-foreground">Venta rapida</div>
            </div>
            <div className="rounded-lg border bg-card/80 p-3 shadow-sm backdrop-blur">
              <div className="text-lg font-semibold">Stock</div>
              <div className="text-xs text-muted-foreground">Control claro</div>
            </div>
            <div className="rounded-lg border bg-card/80 p-3 shadow-sm backdrop-blur">
              <div className="text-lg font-semibold">Roles</div>
              <div className="text-xs text-muted-foreground">Acceso seguro</div>
            </div>
          </div>
        </section>
        <LoginForm className="w-full" />
      </div>
    </main>
  )
}
