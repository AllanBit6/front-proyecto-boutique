import { LogOut } from "lucide-react"

import { ThemeMenu } from "@/components/layout/ThemeMenu"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store"
import type { Role } from "@/shared/types/domain"

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  cashier: "Vendedor",
  warehouse: "Bodega",
}

export function RoleSwitcher() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="flex items-center gap-2">
      <ThemeMenu />
      <div className="hidden min-w-0 text-right text-xs md:block">
        <div className="truncate font-medium">{user?.name}</div>
        <div className="text-muted-foreground">
          {user?.role ? ROLE_LABELS[user.role] : user?.userName}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Cerrar sesion"
        onClick={() => void logout()}
      >
        <LogOut />
      </Button>
    </div>
  )
}
