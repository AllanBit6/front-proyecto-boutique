import { Users } from "lucide-react"

import { UsuariosPage } from "@/features/usuarios/pages/UsuariosPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const usuariosRoutes: FeatureRoute[] = [
  {
    path: "usuarios",
    title: "Equipo",
    element: <UsuariosPage />,
    allowedRoles: ["admin"],
    icon: Users,
    showInSidebar: true,
  },
]
