import { z } from "zod"

import { normalizeTextInput } from "@/shared/utils/security"

const labelField = z
  .string()
  .transform((value) => normalizeTextInput(value, { maxLength: 80 }))
  .pipe(
    z
      .string()
      .min(2, "Ingresa al menos 2 caracteres")
      .max(80, "Máximo 80 caracteres")
  )
const detailField = z
  .string()
  .transform((value) => normalizeTextInput(value, { maxLength: 120 }))
  .pipe(
    z
      .string()
      .min(2, "Ingresa al menos 2 caracteres")
      .max(120, "Máximo 120 caracteres")
  )
const moneyField = z
  .number()
  .finite("Ingresa un monto válido")
  .min(0, "Ingresa un monto válido")
  .max(999999.99, "El monto es demasiado alto")
const stockField = z
  .number()
  .finite("Ingresa un stock válido")
  .int("Ingresa un número entero")
  .min(0, "Ingresa un stock válido")
  .max(999999, "El stock es demasiado alto")

export const productSchema = z.object({
  nombre: labelField,
  caracteristica_distintiva: detailField,
  marca_nombre: labelField,
})

export const variantSchema = z.object({
  producto_id: z.string().min(1, "Selecciona un producto"),
  talla_id: z.string().min(1, "Selecciona una talla"),
  color_id: z.string().min(1, "Selecciona un color"),
  precio_compra: moneyField,
  precio_venta: moneyField,
  stock_minimo: stockField,
})

export type ProductFormValues = z.infer<typeof productSchema>
export type VariantFormValues = z.infer<typeof variantSchema>
