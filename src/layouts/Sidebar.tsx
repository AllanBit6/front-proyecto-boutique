import { Store } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { featureRoutes } from "@/features/featureRoutes"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/store"

export function AppSidebar() {
  const location = useLocation()
  const role = useAuthStore((state) => state.role)
  const visibleRoutes = featureRoutes.filter(
    (route) => role && route.showInSidebar && route.allowedRoles.includes(role)
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="icon-surface size-8 bg-primary text-primary-foreground">
            <Store className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">Boutique POS</div>
            <div className="truncate text-xs text-muted-foreground">
              Venta e inventario
            </div>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Operacion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleRoutes.map((route) => {
                const Icon = route.icon

                return (
                  <SidebarMenuItem key={route.path}>
                    <SidebarMenuButton
                      isActive={location.pathname === `/${route.path}`}
                      render={<NavLink to={`/${route.path}`} />}
                      tooltip={route.title}
                    >
                      {Icon ? <Icon /> : null}
                      <span>{route.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
