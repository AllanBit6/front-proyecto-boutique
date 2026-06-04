import { Monitor, Moon, Settings, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

const THEME_OPTIONS = [
  { value: "light", label: "Claro", icon: Sun },
  { value: "dark", label: "Oscuro", icon: Moon },
  { value: "system", label: "Sistema", icon: Monitor },
] as const

export function ThemeMenu() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Configuracion de apariencia"
          />
        }
      >
        <Settings />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Apariencia</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon

            return (
              <DropdownMenuItem
                key={option.value}
                onClick={() => setTheme(option.value)}
              >
                <Icon />
                {option.label}
                {theme === option.value ? (
                  <span className="ml-auto size-2 rounded-full bg-primary" />
                ) : null}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
