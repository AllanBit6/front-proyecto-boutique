import type { Variant } from "@/features/inventario/types/product"

export function variantLabel(variant: Variant) {
  return [variant.producto_nombre, variant.talla_nombre, variant.color_nombre]
    .filter(Boolean)
    .join(" / ")
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
