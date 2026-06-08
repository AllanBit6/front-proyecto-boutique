import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function NotFoundPage() {
  const user = useAuthStore((state) => state.user)
  const href = user ? getHomePath(user.role) : "/login"

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Página no encontrada</CardTitle>
        </CardHeader>
        <CardContent>
          <Button render={<Link to={href} />} className="w-full">
            {user ? "Volver al inicio" : "Ir al login"}
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
