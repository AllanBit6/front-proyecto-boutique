import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LockKeyhole, Store, UserRound } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuthStore } from "@/store"
import type { Role } from "@/shared/types/domain"

function getHomePath(role: Role) {
  if (role === "cashier") {
    return "/cajero"
  }

  if (role === "warehouse") {
    return "/inventario"
  }

  return "/dashboard"
}

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const userName = String(formData.get("user_name") ?? "")
    const password = String(formData.get("password") ?? "")

    setError(null)
    setIsSubmitting(true)

    try {
      const user = await login({ userName, password })
      navigate(user.firstLogin ? "/reset-password" : getHomePath(user.role), {
        replace: true,
      })
    } catch {
      setError("Usuario o contrasena incorrectos.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border bg-card/92 shadow-xl shadow-slate-950/10 backdrop-blur dark:shadow-black/30">
        <CardHeader className="gap-4 border-b bg-linear-to-br from-primary/12 via-accent/18 to-transparent p-6">
          <div className="icon-surface size-12 bg-primary text-primary-foreground shadow-sm">
            <Store className="size-5" />
          </div>
          <div>
            <CardTitle className="text-xl">Entrar al punto de venta</CardTitle>
            <CardDescription className="mt-1 leading-6">
              Accede para vender, consultar inventario o administrar la tienda.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="user_name">Usuario</FieldLabel>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="user_name"
                    name="user_name"
                    className="h-10 pl-9"
                    autoComplete="username"
                    placeholder="tu.usuario"
                    required
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    className="h-10 pl-9"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </Field>
              <Field>
                {error ? <FieldError>{error}</FieldError> : null}
                <Button
                  className="h-10 w-full"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Validando..." : "Entrar"}
                </Button>
                <FieldDescription className="text-center">
                  Tu sesion queda protegida por el servidor.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
