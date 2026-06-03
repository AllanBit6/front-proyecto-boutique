import { SlidersHorizontal } from "lucide-react"

import { InventoryAdjustmentsPage } from "@/features/ajustes/pages/InventoryAdjustmentsPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const ajustesRoutes: FeatureRoute[] = [
  {
    path: "ajustes-inventario",
    title: "Ajustes",
    element: <InventoryAdjustmentsPage />,
    allowedRoles: ["admin", "warehouse"],
    icon: SlidersHorizontal,
    showInSidebar: true,
  },
]
