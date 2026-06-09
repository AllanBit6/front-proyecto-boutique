import type { Variant } from "@/features/inventario/types/product"
import { readSafeApiError } from "@/shared/utils/apiErrors"

const API_URL = import.meta.env.VITE_API_URL ?? ""

interface ApiCatalog {
  id?: string
  id_producto?: string
  id_marca?: string
  id_talla?: string
  id_color?: string
  marca_id?: string
  marca?: ApiCatalog
  nombre?: string
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
  producto?: ApiCatalog
  talla?: ApiCatalog
  color?: ApiCatalog
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

export type PaymentMethod =
  | "EFECTIVO"
  | "TARJETA_CREDITO"
  | "TARJETA_DEBITO"
  | "TRANSFERENCIA"

export interface CreateSaleInput {
  nombre_cliente: string
  nit: string
  detalles: Array<{
    variante_id: string
    cantidad: number
    precio_unitario: number
  }>
  pagos: Array<{
    metodo: PaymentMethod
    monto: number
    monto_recibido?: number
    numero_referencia?: string
  }>
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

function normalizeVariant(variant: ApiVariant): Variant {
  return {
    id: variant.id_variante ?? variant.id ?? "",
    producto_id:
      variant.producto_id ??
      variant.producto?.id_producto ??
      variant.producto?.id ??
      "",
    producto_nombre: variant.producto?.nombre ?? "",
    marca_id:
      variant.producto?.marca_id ??
      variant.producto?.marca?.id_marca ??
      variant.producto?.marca?.id ??
      "",
    marca_nombre: variant.producto?.marca?.nombre ?? "",
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
    activo: readActive(variant) && readActive(variant.producto ?? {}),
  }
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

export async function fetchVariantByBarcode(code: string): Promise<Variant> {
  const response = await request<unknown>(
    `/variantes/barcode/${encodeURIComponent(code)}`
  )

  return normalizeVariant(readRecord<ApiVariant>(response, ["variante"]))
}

export async function createSale(input: CreateSaleInput) {
  const payload = {
    ...input,
    idempotency_key: crypto.randomUUID(),
  }

  return request("/ventas", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}
