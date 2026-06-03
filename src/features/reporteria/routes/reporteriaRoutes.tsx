import { CreditCard } from "lucide-react"

import { ReporteriaPage } from "@/features/reporteria/pages/ReporteriaPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const reporteriaRoutes: FeatureRoute[] = [
  {
    path: "reportes",
    title: "Pagos",
    element: <ReporteriaPage />,
    allowedRoles: ["admin"],
    icon: CreditCard,
    showInSidebar: true,
  },
]
