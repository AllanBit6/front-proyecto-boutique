import { Receipt } from "lucide-react"

import { VentasPage } from "@/features/ventas/pages/VentasPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const ventasRoutes: FeatureRoute[] = [
  {
    path: "ventas",
    title: "Ventas",
    element: <VentasPage />,
    allowedRoles: ["admin", "cashier"],
    icon: Receipt,
    showInSidebar: true,
  },
]
