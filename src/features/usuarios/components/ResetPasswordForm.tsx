import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useResetPassword } from "@/features/usuarios/hooks/useUsers"
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/features/usuarios/schemas/userSchema"
import type { User } from "@/features/usuarios/types/user"

interface ResetPasswordFormProps {
  user: User
  onSuccess?: () => void
}

export function ResetPasswordForm({
  user,
  onSuccess,
}: ResetPasswordFormProps) {
  const resetPassword = useResetPassword()
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password_nuevo: "",
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await resetPassword.mutateAsync({
      id: user.id,
      input: values,
    })
    form.reset()
    onSuccess?.()
  })

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.password_nuevo)}>
          <FieldLabel htmlFor="password_nuevo">Nueva contraseña</FieldLabel>
          <Input
            id="password_nuevo"
            type="password"
            autoComplete="new-password"
            {...form.register("password_nuevo")}
          />
          <FieldError errors={[form.formState.errors.password_nuevo]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={resetPassword.isPending}>
        {resetPassword.isPending ? "Guardando..." : "Resetear contraseña"}
      </Button>
    </form>
  )
}
