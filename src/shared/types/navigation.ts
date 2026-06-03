import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import type { Role } from "@/shared/types/domain"

export interface FeatureRoute {
  path: string
  title: string
  element: ReactNode
  allowedRoles: Role[]
  icon?: LucideIcon
  showInSidebar?: boolean
}
