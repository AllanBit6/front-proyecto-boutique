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
import { buildBarcode } from "@/features/inventario/utils/codes"
import { readSafeApiError } from "@/shared/utils/apiErrors"

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
  activo?: boolean | string | number
  estado?: string
  deleted_at?: string | null
}

interface ApiProduct {
  id_producto?: string
  id?: string
  nombre?: string
  caracteristica_distintiva?: string
  marca_id?: string
  marca?: ApiCatalog
  activo?: boolean | string | number
  estado?: string
  deleted_at?: string | null
}

interface ApiVariant {
  id_variante?: string
  id?: string
  producto_id?: string
  talla_id?: string
  color_id?: string
  producto?: ApiProduct
  talla?: ApiCatalog & { id_talla?: string }
  color?: ApiCatalog & { id_color?: string }
  sku?: string
  codigo_barras?: string
  codigoBarras?: string
  precio_compra?: number | string
  precio_venta?: number | string
  stock_minimo?: number
  stock_actual?: number
  activo?: boolean | string | number
  estado?: string
  deleted_at?: string | null
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
    const message = await readSafeApiError(response)
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

  return meta && typeof meta === "object"
    ? (meta as ApiMeta)
    : (record as ApiMeta)
}

function readRecord<T>(response: unknown, keys: string[] = []): T {
  if (!response || typeof response !== "object") {
    return {} as T
  }

  const record = response as Record<string, unknown>

  for (const key of keys) {
    const value = record[key]

    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as T
    }
  }

  if (record.data && typeof record.data === "object") {
    return readRecord<T>(record.data, keys)
  }

  return record as T
}

function normalizeCatalog(
  item: ApiCatalog,
  idKey: keyof ApiCatalog
): CatalogOption {
  return {
    id: String(item[idKey] ?? item.id ?? ""),
    nombre: item.nombre ?? "",
  }
}

function readActive(item: {
  activo?: boolean | string | number
  estado?: string
  deleted_at?: string | null
}) {
  if (item.deleted_at) {
    return false
  }

  if (typeof item.activo === "boolean") {
    return item.activo
  }

  if (typeof item.activo === "number") {
    return item.activo === 1
  }

  const value = String(item.activo ?? item.estado ?? "")
    .trim()
    .toLocaleLowerCase()

  if (["false", "0", "inactivo", "desactivado", "inactive"].includes(value)) {
    return false
  }

  return true
}

function normalizeProduct(product: ApiProduct): Product {
  return {
    id: product.id_producto ?? product.id ?? "",
    nombre: product.nombre ?? "",
    caracteristica_distintiva: product.caracteristica_distintiva ?? "",
    marca_id:
      product.marca_id ?? product.marca?.id_marca ?? product.marca?.id ?? "",
    marca_nombre: product.marca?.nombre ?? "",
    activo: readActive(product),
  }
}

function normalizeVariant(variant: ApiVariant): Variant {
  const product = normalizeProduct(variant.producto ?? {})

  return {
    id: variant.id_variante ?? variant.id ?? "",
    producto_id: variant.producto_id ?? product.id,
    producto_nombre: product.nombre,
    marca_id: product.marca_id,
    marca_nombre: product.marca_nombre,
    talla_id:
      variant.talla_id ?? variant.talla?.id_talla ?? variant.talla?.id ?? "",
    talla_nombre: variant.talla?.nombre ?? "",
    color_id:
      variant.color_id ?? variant.color?.id_color ?? variant.color?.id ?? "",
    color_nombre: variant.color?.nombre ?? "",
    sku: variant.sku ?? "",
    codigo_barras: variant.codigo_barras ?? variant.codigoBarras ?? "",
    precio_compra: Number(variant.precio_compra ?? 0),
    precio_venta: Number(variant.precio_venta ?? 0),
    stock_minimo: variant.stock_minimo ?? 0,
    stock_actual: variant.stock_actual ?? 0,
    activo: readActive(variant) && product.activo,
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

export interface CatalogQueryParams {
  page: number
  limit: number
  activo?: boolean
}

function buildCatalogSearchParams(params: CatalogQueryParams) {
  return new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
}

export async function fetchProducts(
  params: CatalogQueryParams
): Promise<PaginatedData<Product>> {
  const searchParams = buildCatalogSearchParams(params)
  const response = await request<unknown>(`/productos?${searchParams}`)
  const products = readArray<ApiProduct>(response, ["productos", "items"])
    .map(normalizeProduct)
    .filter((product) =>
      typeof params.activo === "boolean"
        ? product.activo === params.activo
        : true
    )

  return toPaginatedData(response, products, params)
}

export async function fetchProduct(id: string): Promise<Product> {
  const response = await request<unknown>(`/productos/${id}`)

  return normalizeProduct(readRecord<ApiProduct>(response, ["producto"]))
}

export async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  const response = await request<unknown>("/productos", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeProduct(readRecord<ApiProduct>(response, ["producto"]))
}

export async function updateProduct(params: {
  id: string
  input: UpdateProductInput
}): Promise<Product> {
  const response = await request<unknown>(`/productos/${params.id}`, {
    method: "PATCH",
    body: JSON.stringify(params.input),
  })

  return normalizeProduct(readRecord<ApiProduct>(response, ["producto"]))
}

export async function deleteProduct(id: string): Promise<void> {
  await request<void>(`/productos/${id}`, { method: "DELETE" })
}

export async function fetchVariants(params: {
  page: number
  limit: number
  activo?: boolean
}): Promise<PaginatedData<Variant>> {
  const searchParams = buildCatalogSearchParams(params)
  const response = await request<unknown>(`/variantes?${searchParams}`)
  const variants = readArray<ApiVariant>(response, ["variantes", "items"])
    .map(normalizeVariant)
    .filter((variant) =>
      typeof params.activo === "boolean"
        ? variant.activo === params.activo
        : true
    )

  return toPaginatedData(response, variants, params)
}

export async function fetchVariant(id: string): Promise<Variant> {
  const response = await request<unknown>(`/variantes/${id}`)

  return normalizeVariant(readRecord<ApiVariant>(response, ["variante"]))
}

export async function createVariant(
  input: CreateVariantInput
): Promise<Variant> {
  const codigoBarras = input.codigo_barras || buildBarcode()
  const payload = {
    ...input,
    codigo_barras: codigoBarras,
  }
  const response = await request<unknown>("/variantes", {
    method: "POST",
    body: JSON.stringify(payload),
  })
  const variant = normalizeVariant(
    readRecord<ApiVariant>(response, ["variante"])
  )

  return variant
}

export async function updateVariant(params: {
  id: string
  input: UpdateVariantInput
}): Promise<Variant> {
  const codigoBarras = params.input.codigo_barras || buildBarcode()
  const payload = {
    ...params.input,
    codigo_barras: codigoBarras,
  }
  const response = await request<unknown>(`/variantes/${params.id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

  return normalizeVariant(readRecord<ApiVariant>(response, ["variante"]))
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

export async function createBrand(
  input: CreateBrandInput
): Promise<CatalogOption> {
  const response = await request<ApiCatalog>("/marcas", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeCatalog(response, "id_marca")
}

export async function deleteBrand(id: string): Promise<void> {
  await request<void>(`/marcas/${id}`, { method: "DELETE" })
}

export async function fetchSizes(): Promise<CatalogOption[]> {
  const response = await request<unknown>("/tallas")

  return readArray<ApiCatalog>(response, ["tallas", "items"]).map((item) =>
    normalizeCatalog(item, "id_talla")
  )
}

export async function createSize(
  input: CreateCatalogInput
): Promise<CatalogOption> {
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

export async function createColor(
  input: CreateCatalogInput
): Promise<CatalogOption> {
  const response = await request<ApiCatalog>("/colores", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeCatalog(response, "id_color")
}

export async function deleteColor(id: string): Promise<void> {
  await request<void>(`/colores/${id}`, { method: "DELETE" })
}
