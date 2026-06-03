import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"

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

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)
  const changePassword = useAuthStore((state) => state.changePassword)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user && !user.firstLogin) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    const currentPassword = String(formData.get("current_password") ?? "")
    const newPassword = String(formData.get("new_password") ?? "")
    const confirmPassword = String(formData.get("confirm_password") ?? "")

    setError(null)

    if (newPassword.length < 6) {
      setError("La nueva contrasena debe tener al menos 6 caracteres.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmacion no coincide con la nueva contrasena.")
      return
    }

    setIsSubmitting(true)

    try {
      await changePassword({ currentPassword, newPassword })
      navigate("/dashboard", { replace: true })
    } catch {
      setError("No se pudo actualizar la contrasena. Revisa la contrasena actual.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Actualiza tu contrasena</CardTitle>
          <CardDescription>
            Antes de entrar al POS necesitas definir una contrasena nueva.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="current_password">
                  Contrasena temporal
                </FieldLabel>
                <Input
                  id="current_password"
                  name="current_password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="new_password">Nueva contrasena</FieldLabel>
                <Input
                  id="new_password"
                  name="new_password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="confirm_password">
                  Confirmar contrasena
                </FieldLabel>
                <Input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  required
                />
              </Field>
              <Field>
                {error ? <FieldError>{error}</FieldError> : null}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Actualizando..." : "Guardar contrasena"}
                </Button>
                <FieldDescription className="text-center">
                  Luego entraras al sistema automaticamente.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
