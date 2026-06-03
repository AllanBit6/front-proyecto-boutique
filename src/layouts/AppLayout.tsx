import { Menu, Store } from "lucide-react"
import { Outlet } from "react-router-dom"

import { RoleSwitcher } from "@/components/layout/RoleSwitcher"
import { AppSidebar } from "@/layouts/Sidebar"
import { Button } from "@/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export function AppLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background px-4">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger
              render={<Button variant="ghost" size="icon" aria-label="Menu" />}
            >
              <Menu />
            </SidebarTrigger>
            <div className="flex min-w-0 items-center gap-2">
              <Store className="size-5 text-primary" />
              <span className="truncate text-sm font-medium">
                POS Boutique
              </span>
            </div>
          </div>
          <RoleSwitcher />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
