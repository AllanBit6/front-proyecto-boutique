import { useState } from "react"
import { useNavigate } from "react-router-dom"

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
      navigate(user.firstLogin ? "/reset-password" : "/dashboard", {
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
      <Card>
        <CardHeader>
          <CardTitle>Ingresar</CardTitle>
          <CardDescription>
            Usa tus credenciales para acceder al POS.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="user_name">Usuario</FieldLabel>
                <Input
                  id="user_name"
                  name="user_name"
                  autoComplete="username"
                  placeholder="admin"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Contrasena</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field>
                {error ? <FieldError>{error}</FieldError> : null}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Ingresando..." : "Ingresar"}
                </Button>
                <FieldDescription className="text-center">
                  La sesion se valida con el servidor.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
