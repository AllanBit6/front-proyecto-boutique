import { Banknote } from "lucide-react"

import { CajaPage } from "@/features/caja/pages/CajaPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const cajaRoutes: FeatureRoute[] = [
  {
    path: "caja",
    title: "Caja",
    element: <CajaPage />,
    allowedRoles: ["admin", "cashier"],
    icon: Banknote,
    showInSidebar: true,
  },
]
