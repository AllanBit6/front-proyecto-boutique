import { NavLink } from "react-router-dom"

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
  const role = useAuthStore((state) => state.role)
  const visibleRoutes = featureRoutes.filter(
    (route) => role && route.showInSidebar && route.allowedRoles.includes(role)
  )

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="px-2 py-1 text-sm font-semibold">Front POS</div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Modulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleRoutes.map((route) => {
                const Icon = route.icon

                return (
                  <SidebarMenuItem key={route.path}>
                    <SidebarMenuButton
                      render={<NavLink to={`/${route.path}`} />}
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
