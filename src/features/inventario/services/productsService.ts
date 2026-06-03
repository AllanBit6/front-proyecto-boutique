import type {
  CatalogOption,
  CreateBrandInput,
  CreateCatalogInput,
  CreateProductInput,
  CreateVariantInput,
  PaginatedData,
  Product,
  UpdateProductInput,
  UpdateVariantInput,
  Variant,
} from "@/features/inventario/types/product"

const API_URL = import.meta.env.VITE_API_URL ?? ""

interface ApiMeta {
  total?: number
  page?: number
  perPage?: number
  limit?: number
  totalPages?: number
}

interface ApiCatalog {
  id?: string
  id_marca?: string
  id_talla?: string
  id_color?: string
  nombre?: string
}

interface ApiProduct {
  id_producto?: string
  id?: string
  nombre?: string
  caracteristica_distintiva?: string
  marca_id?: string
  marca?: ApiCatalog
  activo?: boolean
}

interface ApiVariant {
  id_variante?: string
  id?: string
  producto_id?: string
  talla_id?: string
  color_id?: string
  producto?: ApiCatalog & { id_producto?: string }
  talla?: ApiCatalog & { id_talla?: string }
  color?: ApiCatalog & { id_color?: string }
  sku?: string
  codigo_barras?: string
  precio_compra?: number | string
  precio_venta?: number | string
  stock_minimo?: number
  stock_actual?: number
  activo?: boolean
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || "No se pudo completar la solicitud.")
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function readArray<T>(response: unknown, keys: string[]): T[] {
  if (Array.isArray(response)) {
    return response as T[]
  }

  if (!response || typeof response !== "object") {
    return []
  }

  const record = response as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (Array.isArray(value)) {
      return value as T[]
    }
  }

  if (record.data && typeof record.data === "object") {
    return readArray<T>(record.data, keys)
  }

  return []
}

function readMeta(response: unknown): ApiMeta {
  if (!response || typeof response !== "object") {
    return {}
  }

  const record = response as Record<string, unknown>
  const meta = record.meta ?? record.pagination

  return meta && typeof meta === "object" ? (meta as ApiMeta) : (record as ApiMeta)
}

function normalizeCatalog(item: ApiCatalog, idKey: keyof ApiCatalog): CatalogOption {
  return {
    id: String(item[idKey] ?? item.id ?? ""),
    nombre: item.nombre ?? "",
  }
}

function normalizeProduct(product: ApiProduct): Product {
  return {
    id: product.id_producto ?? product.id ?? "",
    nombre: product.nombre ?? "",
    caracteristica_distintiva: product.caracteristica_distintiva ?? "",
    marca_id: product.marca_id ?? product.marca?.id_marca ?? product.marca?.id ?? "",
    marca_nombre: product.marca?.nombre ?? "",
    activo: product.activo ?? true,
  }
}

function normalizeVariant(variant: ApiVariant): Variant {
  return {
    id: variant.id_variante ?? variant.id ?? "",
    producto_id:
      variant.producto_id ?? variant.producto?.id_producto ?? variant.producto?.id ?? "",
    producto_nombre: variant.producto?.nombre ?? "",
    talla_id: variant.talla_id ?? variant.talla?.id_talla ?? variant.talla?.id ?? "",
    talla_nombre: variant.talla?.nombre ?? "",
    color_id: variant.color_id ?? variant.color?.id_color ?? variant.color?.id ?? "",
    color_nombre: variant.color?.nombre ?? "",
    sku: variant.sku ?? "",
    codigo_barras: variant.codigo_barras ?? "",
    precio_compra: Number(variant.precio_compra ?? 0),
    precio_venta: Number(variant.precio_venta ?? 0),
    stock_minimo: variant.stock_minimo ?? 0,
    stock_actual: variant.stock_actual ?? 0,
    activo: variant.activo ?? true,
  }
}

function toPaginatedData<T>(
  response: unknown,
  data: T[],
  params: { page: number; limit: number }
): PaginatedData<T> {
  const meta = readMeta(response)
  const limit = meta.perPage ?? meta.limit ?? params.limit
  const total = meta.total ?? data.length

  return {
    data,
    page: meta.page ?? params.page,
    limit,
    total,
    totalPages: meta.totalPages ?? Math.max(1, Math.ceil(total / limit)),
  }
}

export async function fetchProducts(params: {
  page: number
  limit: number
}): Promise<PaginatedData<Product>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  const response = await request<unknown>(`/productos?${searchParams}`)
  const products = readArray<ApiProduct>(response, ["productos", "items"]).map(
    normalizeProduct
  )

  return toPaginatedData(response, products, params)
}

export async function fetchProduct(id: string): Promise<Product> {
  const response = await request<ApiProduct>(`/productos/${id}`)

  return normalizeProduct(response)
}

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const response = await request<ApiProduct>("/productos", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeProduct(response)
}

export async function updateProduct(params: {
  id: string
  input: UpdateProductInput
}): Promise<Product> {
  const response = await request<ApiProduct>(`/productos/${params.id}`, {
    method: "PATCH",
    body: JSON.stringify(params.input),
  })

  return normalizeProduct(response)
}

export async function deleteProduct(id: string): Promise<void> {
  await request<void>(`/productos/${id}`, { method: "DELETE" })
}

export async function fetchVariants(params: {
  page: number
  limit: number
}): Promise<PaginatedData<Variant>> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  const response = await request<unknown>(`/variantes?${searchParams}`)
  const variants = readArray<ApiVariant>(response, ["variantes", "items"]).map(
    normalizeVariant
  )

  return toPaginatedData(response, variants, params)
}

export async function fetchVariant(id: string): Promise<Variant> {
  const response = await request<ApiVariant>(`/variantes/${id}`)

  return normalizeVariant(response)
}

export async function createVariant(input: CreateVariantInput): Promise<Variant> {
  const response = await request<ApiVariant>("/variantes", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeVariant(response)
}

export async function updateVariant(params: {
  id: string
  input: UpdateVariantInput
}): Promise<Variant> {
  const response = await request<ApiVariant>(`/variantes/${params.id}`, {
    method: "PATCH",
    body: JSON.stringify(params.input),
  })

  return normalizeVariant(response)
}

export async function deleteVariant(id: string): Promise<void> {
  await request<void>(`/variantes/${id}`, { method: "DELETE" })
}

export async function fetchBrands(): Promise<CatalogOption[]> {
  const response = await request<unknown>("/marcas")

  return readArray<ApiCatalog>(response, ["marcas", "items"]).map((item) =>
    normalizeCatalog(item, "id_marca")
  )
}

export async function createBrand(input: CreateBrandInput): Promise<CatalogOption> {
  const response = await request<ApiCatalog>("/marcas", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeCatalog(response, "id_marca")
}

export async function fetchSizes(): Promise<CatalogOption[]> {
  const response = await request<unknown>("/tallas")

  return readArray<ApiCatalog>(response, ["tallas", "items"]).map((item) =>
    normalizeCatalog(item, "id_talla")
  )
}

export async function createSize(input: CreateCatalogInput): Promise<CatalogOption> {
  const response = await request<ApiCatalog>("/tallas", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeCatalog(response, "id_talla")
}

export async function deleteSize(id: string): Promise<void> {
  await request<void>(`/tallas/${id}`, { method: "DELETE" })
}

export async function fetchColors(): Promise<CatalogOption[]> {
  const response = await request<unknown>("/colores")

  return readArray<ApiCatalog>(response, ["colores", "items"]).map((item) =>
    normalizeCatalog(item, "id_color")
  )
}

export async function createColor(input: CreateCatalogInput): Promise<CatalogOption> {
  const response = await request<ApiCatalog>("/colores", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeCatalog(response, "id_color")
}

export async function deleteColor(id: string): Promise<void> {
  await request<void>(`/colores/${id}`, { method: "DELETE" })
}
