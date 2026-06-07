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
      <SidebarInset className="auth-route-enter">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-card/95 px-4 shadow-sm shadow-slate-950/5 backdrop-blur supports-[backdrop-filter]:bg-card/80">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger
              render={<Button variant="ghost" size="icon" aria-label="Menu" />}
            >
              <Menu />
            </SidebarTrigger>
            <div className="flex min-w-0 items-center gap-2">
              <span className="icon-surface size-7 bg-primary/10 text-primary">
                <Store className="size-4" />
              </span>
              <span className="truncate text-sm font-medium">Boutique POS</span>
            </div>
          </div>
          <RoleSwitcher />
        </header>
        <main className="page-shell flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
