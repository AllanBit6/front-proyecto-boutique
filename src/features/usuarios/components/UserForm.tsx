import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

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
  const [submitError, setSubmitError] = useState("")
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: getDefaultValues(user),
  })

  useEffect(() => {
    form.reset(getDefaultValues(user))
  }, [form, user])

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError("")

    let promise: Promise<unknown>

    if (user) {
      promise = updateUser.mutateAsync({
        id: user.id,
        input: {
          nombre: values.nombre,
          apellido: values.apellido,
          user_name: values.user_name,
          rol_id: values.rol_id,
        },
      })
    } else {
      if (!values.password || values.password.length < 6) {
        form.setError("password", {
          message: "Ingresa al menos 6 caracteres",
        })
        return
      }

      promise = createUser.mutateAsync({
        nombre: values.nombre,
        apellido: values.apellido,
        user_name: values.user_name,
        password: values.password,
        rol_id: values.rol_id,
      })
    }

    toast.promise(promise, {
      loading: user ? "Guardando usuario..." : "Creando usuario...",
      success: user
        ? "Usuario actualizado correctamente."
        : "Usuario creado correctamente.",
      error: (error) =>
        getErrorMessage(error, "No se pudo guardar el usuario."),
    })

    try {
      await promise
      form.reset(getDefaultValues())
      onSuccess?.()
    } catch (error) {
      setSubmitError(getErrorMessage(error, "No se pudo guardar el usuario."))
    }
  })

  const isPending = createUser.isPending || updateUser.isPending
  const selectedRoleId = useWatch({ control: form.control, name: "rol_id" })
  const selectedRole = roles.find((role) => role.id === selectedRoleId)

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
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
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
      {!roles.length ? (
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          No hay permisos disponibles para asignar.
        </div>
      ) : null}
      {submitError ? <FieldError>{submitError}</FieldError> : null}
      <Button
        className="w-full"
        type="submit"
        disabled={isPending || !roles.length}
      >
        {isPending
          ? "Guardando..."
          : isEditing
            ? "Guardar cambios"
            : "Crear usuario"}
      </Button>
    </form>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
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
