import { z } from "zod"

export const userFormSchema = z.object({
  nombre: z.string().min(2, "Ingresa al menos 2 caracteres"),
  apellido: z.string().min(2, "Ingresa al menos 2 caracteres"),
  user_name: z.string().min(3, "Ingresa al menos 3 caracteres"),
  password: z.string().optional(),
  rol_id: z.string().min(1, "Selecciona un rol"),
})

export const resetPasswordSchema = z.object({
  password_nuevo: z.string().min(6, "Ingresa al menos 6 caracteres"),
})

export type UserFormValues = z.infer<typeof userFormSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
