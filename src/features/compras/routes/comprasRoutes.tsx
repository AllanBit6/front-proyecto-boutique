import { ShoppingBag } from "lucide-react"

import { ComprasPage } from "@/features/compras/pages/ComprasPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const comprasRoutes: FeatureRoute[] = [
  {
    path: "compras",
    title: "Compras",
    element: <ComprasPage />,
    allowedRoles: ["admin", "warehouse"],
    icon: ShoppingBag,
    showInSidebar: true,
  },
]
