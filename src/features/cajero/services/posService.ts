import type { Variant } from "@/features/inventario/types/product"

const API_URL = import.meta.env.VITE_API_URL ?? ""

interface ApiCatalog {
  id?: string
  id_producto?: string
  id_talla?: string
  id_color?: string
  nombre?: string
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
    const message = await readErrorMessage(response)

    console.error("[API error]", {
      path,
      status: response.status,
      message,
    })

    throw new Error(message || "No se pudo completar la solicitud.")
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function readErrorMessage(response: Response) {
  const text = await response.text()

  if (!text) {
    return ""
  }

  try {
    const data = JSON.parse(text) as Record<string, unknown>
    const message = data.message ?? data.error ?? data.detail

    if (Array.isArray(message)) {
      return message.join(", ")
    }

    if (message) {
      return String(message)
    }
  } catch {
    return text
  }

  return text
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
    activo: readActive(variant),
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

  console.info("[sale] request", payload)

  return request("/ventas", {
    method: "POST",
    body: JSON.stringify(payload),
  }).then((response) => {
    console.info("[sale] response", response)

    return response
  })
}
