import { ScanBarcode } from "lucide-react"

import { CajeroPage } from "@/features/cajero/pages/CajeroPage"
import type { FeatureRoute } from "@/shared/types/navigation"

export const cajeroRoutes: FeatureRoute[] = [
  {
    path: "cajero",
    title: "Cajero",
    element: <CajeroPage />,
    allowedRoles: ["cashier"],
    icon: ScanBarcode,
    showInSidebar: true,
  },
]
