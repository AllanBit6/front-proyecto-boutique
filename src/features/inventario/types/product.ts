export interface CatalogOption {
  id: string
  nombre: string
}

export interface Product {
  id: string
  nombre: string
  caracteristica_distintiva: string
  marca_id: string
  marca_nombre: string
  activo: boolean
}

export interface Variant {
  id: string
  producto_id: string
  producto_nombre: string
  marca_id: string
  marca_nombre: string
  talla_id: string
  talla_nombre: string
  color_id: string
  color_nombre: string
  sku: string
  codigo_barras: string
  precio_compra: number
  precio_venta: number
  stock_minimo: number
  stock_actual: number
  activo: boolean
}

export interface PaginatedData<T> {
  data: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CreateProductInput {
  nombre: string
  caracteristica_distintiva: string
  marca_id: string
}

export interface CreateBrandInput {
  nombre: string
}

export interface CreateCatalogInput {
  nombre: string
}

export interface UpdateProductInput extends CreateProductInput {
  activo?: boolean
}

export interface CreateVariantInput {
  producto_id: string
  talla_id: string
  color_id: string
  sku: string
  codigo_barras?: string
  precio_compra: number
  precio_venta: number
  stock_minimo: number
}

export interface UpdateVariantInput extends CreateVariantInput {
  activo?: boolean
}
