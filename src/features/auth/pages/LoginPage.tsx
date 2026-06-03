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
    <main className="grid min-h-svh place-items-center bg-background p-4">
      <LoginForm className="w-full max-w-sm" />
    </main>
  )
}
