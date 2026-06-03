import { Boxes } from "lucide-react"

import { InventarioPage } from "@/features/inventario/pages/InventarioPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const inventarioRoutes: FeatureRoute[] = [
  {
    path: "inventario",
    title: "Inventario",
    element: <InventarioPage />,
    allowedRoles: ["admin", "cashier", "warehouse"],
    icon: Boxes,
    showInSidebar: true,
  },
]
