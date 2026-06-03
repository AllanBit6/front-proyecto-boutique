import { LayoutDashboard } from "lucide-react"

import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const dashboardRoutes: FeatureRoute[] = [
  {
    path: "dashboard",
    title: "Dashboard",
    element: <DashboardPage />,
    allowedRoles: ["admin", "cashier"],
    icon: LayoutDashboard,
    showInSidebar: true,
  },
]
