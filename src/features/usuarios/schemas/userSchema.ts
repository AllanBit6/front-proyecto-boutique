import { z } from "zod"

import { normalizeTextInput, normalizeUsername } from "@/shared/utils/security"

const nameField = z
  .string()
  .transform((value) => normalizeTextInput(value, { maxLength: 60 }))
  .pipe(
    z
      .string()
      .min(2, "Ingresa al menos 2 caracteres")
      .max(60, "Máximo 60 caracteres")
  )

const usernameField = z
  .string()
  .transform(normalizeUsername)
  .pipe(
    z
      .string()
      .min(3, "Ingresa al menos 3 caracteres")
      .max(40, "Máximo 40 caracteres")
      .regex(
        /^[a-z0-9._-]+$/,
        "Usa solo letras, números, punto, guion o guion bajo"
      )
  )

const passwordField = z
  .string()
  .min(8, "Ingresa al menos 8 caracteres")
  .max(128, "Máximo 128 caracteres")
  .regex(/[A-Za-z]/, "Incluye al menos una letra")
  .regex(/[0-9]/, "Incluye al menos un número")

export const userFormSchema = z.object({
  nombre: nameField,
  apellido: nameField,
  user_name: usernameField,
  password: z.union([z.literal(""), passwordField]).optional(),
  rol_id: z.string().min(1, "Selecciona un rol"),
})

export const resetPasswordSchema = z.object({
  password_nuevo: passwordField,
})

export type UserFormValues = z.infer<typeof userFormSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
