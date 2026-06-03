import { Navigate } from "react-router-dom"

import { LoginForm } from "@/components/login-form"
import { useAuthStore } from "@/store"

export function LoginPage() {
  const user = useAuthStore((state) => state.user)

  if (user) {
    return <Navigate to={user.firstLogin ? "/reset-password" : "/dashboard"} replace />
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <LoginForm className="w-full max-w-sm" />
    </main>
  )
}
