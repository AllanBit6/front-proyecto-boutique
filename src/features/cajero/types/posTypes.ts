import type { Variant } from "@/features/inventario/types/product"

export interface CartItem {
  variant: Variant
  quantity: number
}
