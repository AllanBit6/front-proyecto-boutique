import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  useCreateUser,
  useUpdateUser,
} from "@/features/usuarios/hooks/useUsers"
import {
  type UserFormValues,
  userFormSchema,
} from "@/features/usuarios/schemas/userSchema"
import type { RoleOption, User } from "@/features/usuarios/types/user"

interface UserFormProps {
  roles: RoleOption[]
  user?: User
  onSuccess?: () => void
}

export function UserForm({ roles, user, onSuccess }: UserFormProps) {
  const isEditing = Boolean(user)
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: getDefaultValues(user),
  })

  useEffect(() => {
    form.reset(getDefaultValues(user))
  }, [form, user])

  const onSubmit = form.handleSubmit(async (values) => {
    if (user) {
      const { password: _password, ...input } = values
      await updateUser.mutateAsync({ id: user.id, input })
    } else {
      if (!values.password || values.password.length < 6) {
        form.setError("password", {
          message: "Ingresa al menos 6 caracteres",
        })
        return
      }

      await createUser.mutateAsync({
        nombre: values.nombre,
        apellido: values.apellido,
        user_name: values.user_name,
        password: values.password,
        rol_id: values.rol_id,
      })
    }

    form.reset(getDefaultValues())
    onSuccess?.()
  })

  const isPending = createUser.isPending || updateUser.isPending
  const selectedRole = roles.find((role) => role.id === form.watch("rol_id"))

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.nombre)}>
          <FieldLabel htmlFor="nombre">Nombre</FieldLabel>
          <Input id="nombre" {...form.register("nombre")} />
          <FieldError errors={[form.formState.errors.nombre]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.apellido)}>
          <FieldLabel htmlFor="apellido">Apellido</FieldLabel>
          <Input id="apellido" {...form.register("apellido")} />
          <FieldError errors={[form.formState.errors.apellido]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.user_name)}>
          <FieldLabel htmlFor="user_name">Nombre de acceso</FieldLabel>
          <Input
            id="user_name"
            autoComplete="username"
            {...form.register("user_name")}
          />
          <FieldError errors={[form.formState.errors.user_name]} />
        </Field>
        {!isEditing ? (
          <Field data-invalid={Boolean(form.formState.errors.password)}>
            <FieldLabel htmlFor="password">Contrasena</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
            <FieldError errors={[form.formState.errors.password]} />
          </Field>
        ) : null}
        <Field data-invalid={Boolean(form.formState.errors.rol_id)}>
          <FieldLabel>Permiso</FieldLabel>
          <Controller
            control={form.control}
            name="rol_id"
            render={({ field }) => (
              <Select
                value={field.value || undefined}
                onValueChange={(value) => {
                  field.onChange(value ?? "")
                  field.onBlur()
                }}
                disabled={!roles.length}
              >
                <SelectTrigger>
                  <span
                    className={!selectedRole ? "text-muted-foreground" : ""}
                  >
                    {selectedRole?.nombre ?? "Selecciona permiso"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError errors={[form.formState.errors.rol_id]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isPending || !roles.length}>
        {isPending
          ? "Guardando..."
          : isEditing
            ? "Guardar cambios"
            : "Crear usuario"}
      </Button>
    </form>
  )
}

function getDefaultValues(user?: User): UserFormValues {
  return {
    nombre: user?.nombre ?? "",
    apellido: user?.apellido ?? "",
    user_name: user?.user_name ?? "",
    password: "",
    rol_id: user?.rol_id ?? "",
  }
}
