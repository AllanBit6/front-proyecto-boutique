import { z } from "zod"

export const productSchema = z.object({
  nombre: z.string().min(2, "Ingresa al menos 2 caracteres"),
  caracteristica_distintiva: z.string().min(2, "Ingresa al menos 2 caracteres"),
  marca_nombre: z.string().min(2, "Ingresa o selecciona una marca"),
})

export const variantSchema = z.object({
  producto_id: z.string().min(1, "Selecciona un producto"),
  talla_id: z.string().min(1, "Selecciona una talla"),
  color_id: z.string().min(1, "Selecciona un color"),
  precio_compra: z.number().min(0, "Ingresa un monto valido"),
  precio_venta: z.number().min(0, "Ingresa un monto valido"),
  stock_minimo: z.number().int().min(0, "Ingresa un stock valido"),
})

export type ProductFormValues = z.infer<typeof productSchema>
export type VariantFormValues = z.infer<typeof variantSchema>
