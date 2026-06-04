const API_URL = import.meta.env.VITE_API_URL ?? ""

export interface PaginatedData<T> {
  data: T[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface DashboardMetrics {
  ingresosHoy?: number
  ventasHoy?: number
  ingresosMes?: number
  ticketProm?: number
  ticketPromedio?: number
  ventasSemanales?: Array<{ dia: string; total: number }>
  topProducts?: Array<{ nombre?: string; cantidad?: number }>
  topVariantes?: Array<{ nombre?: string; cantidad?: number }>
  ventasMes?: Array<{ mes?: string; total?: number }>
  ventasAnio?: Array<{ mes?: string; total?: number }>
}

export interface CashRegister {
  id: string
  usuario: string
  saldoInicial: number
  saldoFinal?: number
  fechaApertura?: string
  fechaCierre?: string
  activo: boolean
  observaciones?: string
}

export interface Purchase {
  id: string
  fecha: string
  total: number
  activo: boolean
  usuario: string
  items: number
}

export interface Sale {
  id: string
  fecha: string
  total: number
  activo: boolean
  cliente?: string
  nit?: string
  usuario: string
  items: number
}

export interface SaleDetail extends Sale {
  detalles: Array<{
    id: string
    prenda: string
    sku?: string
    codigoBarras?: string
    cantidad: number
    precioUnitario: number
    subtotal: number
  }>
  pagos: Array<Payment>
}

export interface InventoryMovement {
  id: string
  fecha: string
  tipo: string
  origen: string
  cantidad: number
  motivo?: string
  stockResultante: number
  prenda: string
  usuario: string
}

export interface Payment {
  id: string
  fecha: string
  metodo: string
  monto: number
  montoRecibido?: number
  cambio?: number
  numeroReferencia?: string
  estado: string
  ventaId?: string
  cliente?: string
  nit?: string
  usuario?: string
}

interface ApiMeta {
  total?: number
  page?: number
  perPage?: number
  limit?: number
  totalPages?: number
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

function readArray<T>(
  response: unknown,
  keys: string[] = ["data", "items", "movimientos", "movimientosInventario"]
) {
  if (Array.isArray(response)) {
    return response as T[]
  }

  if (!response || typeof response !== "object") {
    return []
  }

  const record = response as Record<string, unknown>

  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as T[]
    }
  }

  if (record.data && typeof record.data === "object") {
    return readArray<T>(record.data, keys)
  }

  return []
}

function toPaginated<T>(
  response: unknown,
  data: T[],
  params: { page: number; limit: number }
): PaginatedData<T> {
  const record =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : {}
  const meta = (record.meta ?? record.pagination ?? record) as ApiMeta
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

function fullName(value: unknown) {
  if (!value || typeof value !== "object") {
    return ""
  }

  const user = value as Record<string, unknown>

  return [user.nombre, user.apellido].filter(Boolean).join(" ")
}

function numberValue(value: unknown) {
  return Number(value ?? 0)
}

function readActiveState(item: Record<string, unknown>) {
  const status = String(item.estado ?? item.status ?? "")
    .trim()
    .toLocaleLowerCase()

  if (
    ["anulada", "anulado", "cancelada", "cancelado", "void", "cancelled"].some(
      (value) => status.includes(value)
    )
  ) {
    return false
  }

  if (typeof item.activo === "boolean") {
    return item.activo
  }

  if (typeof item.activo === "number") {
    return item.activo === 1
  }

  if (typeof item.activo === "string") {
    const active = item.activo.trim().toLocaleLowerCase()

    if (
      ["false", "0", "no", "inactivo", "anulado", "anulada"].includes(active)
    ) {
      return false
    }

    if (["true", "1", "si", "activo", "vigente"].includes(active)) {
      return true
    }
  }

  return true
}

function optionalNumberValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return undefined
  }

  return Number(value)
}

function variantName(value: unknown) {
  if (!value || typeof value !== "object") {
    return ""
  }

  const variant = value as Record<string, unknown>
  const product = variant.producto as Record<string, unknown> | undefined
  const size = variant.talla as Record<string, unknown> | undefined
  const color = variant.color as Record<string, unknown> | undefined

  return [product?.nombre, size?.nombre, color?.nombre]
    .filter(Boolean)
    .join(" / ")
}

function normalizePayment(item: Record<string, unknown>): Payment {
  const sale = item.venta as Record<string, unknown> | undefined

  return {
    id: String(item.id_pago ?? item.id ?? ""),
    fecha: String(item.fecha_pago ?? ""),
    metodo: String(item.metodo ?? ""),
    monto: numberValue(item.monto),
    montoRecibido: optionalNumberValue(item.monto_recibido),
    cambio: optionalNumberValue(item.cambio ?? item.vuelto),
    numeroReferencia: String(
      item.numero_referencia ?? item.referencia ?? item.no_referencia ?? ""
    ),
    estado: String(item.estado ?? ""),
    ventaId: String(item.venta_id ?? sale?.id_venta ?? ""),
    cliente: String(sale?.nombre_cliente ?? ""),
    nit: String(sale?.nit ?? ""),
    usuario: fullName(sale?.usuario),
  }
}

export async function fetchDashboard(): Promise<DashboardMetrics> {
  return request<DashboardMetrics>("/dashboard")
}

export async function fetchCashRegisters(params: {
  page: number
  limit: number
}): Promise<PaginatedData<CashRegister>> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  const response = await request<unknown>(`/caja?${search}`)
  const registers = readArray<Record<string, unknown>>(response).map(
    (item) => ({
      id: String(item.id_caja ?? item.id ?? ""),
      usuario: fullName(item.usuario),
      saldoInicial: numberValue(item.saldo_inicial),
      saldoFinal:
        item.saldo_final === null || item.saldo_final === undefined
          ? undefined
          : numberValue(item.saldo_final),
      fechaApertura: String(item.fecha_apertura ?? ""),
      fechaCierre: item.fecha_cierre ? String(item.fecha_cierre) : undefined,
      activo: Boolean(item.activo),
      observaciones: String(item.observaciones ?? ""),
    })
  )

  return toPaginated(response, registers, params)
}

export async function fetchActiveCashRegister(): Promise<CashRegister | null> {
  try {
    const item = await request<Record<string, unknown>>("/caja/activa")

    return {
      id: String(item.id_caja ?? item.id ?? ""),
      usuario: fullName(item.usuario),
      saldoInicial: numberValue(item.saldo_inicial),
      saldoFinal:
        item.saldo_final === null || item.saldo_final === undefined
          ? undefined
          : numberValue(item.saldo_final),
      fechaApertura: String(item.fecha_apertura ?? ""),
      fechaCierre: item.fecha_cierre ? String(item.fecha_cierre) : undefined,
      activo: Boolean(item.activo),
      observaciones: String(item.observaciones ?? ""),
    }
  } catch {
    return null
  }
}

export async function openCashRegister(input: {
  saldo_inicial: number
  observaciones?: string
}) {
  return request("/caja/apertura", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function closeCashRegister(input: {
  id: string
  saldo_final: number
  observaciones?: string
}) {
  return request(`/caja/${input.id}/cierre`, {
    method: "PATCH",
    body: JSON.stringify({
      saldo_final: input.saldo_final,
      observaciones: input.observaciones,
    }),
  })
}

export async function fetchPurchases(params: {
  page: number
  limit: number
}): Promise<PaginatedData<Purchase>> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  const response = await request<unknown>(`/compras?${search}`)
  const purchases = readArray<Record<string, unknown>>(response).map(
    (item) => ({
      id: String(item.id_compra ?? item.id ?? ""),
      fecha: String(item.fecha_compra ?? ""),
      total: numberValue(item.total),
      activo: readActiveState(item),
      usuario: fullName(item.usuario),
      items: numberValue(
        (item._count as Record<string, unknown>)?.detalles_compras
      ),
    })
  )

  return toPaginated(response, purchases, params)
}

export async function createPurchase(input: {
  variante_id: string
  cantidad: number
  precio_unitario: number
}) {
  return request("/compras", {
    method: "POST",
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      detalles: [input],
    }),
  })
}

export async function cancelPurchase(input: { id: string; motivo: string }) {
  return request(`/compras/${input.id}/anular`, {
    method: "PATCH",
    body: JSON.stringify({ motivo: input.motivo }),
  })
}

export async function fetchSales(params: {
  page: number
  limit: number
}): Promise<PaginatedData<Sale>> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  const response = await request<unknown>(`/ventas?${search}`)
  const sales = readArray<Record<string, unknown>>(response).map((item) => ({
    id: String(item.id_venta ?? item.id ?? ""),
    fecha: String(item.fecha_venta ?? ""),
    total: numberValue(item.total),
    activo: readActiveState(item),
    cliente: String(item.nombre_cliente ?? ""),
    nit: String(item.nit ?? ""),
    usuario: fullName(item.usuario),
    items: numberValue(
      (item._count as Record<string, unknown>)?.detalles_venta
    ),
  }))

  return toPaginated(response, sales, params)
}

export async function fetchSaleDetail(id: string): Promise<SaleDetail> {
  const response = await request<unknown>(`/ventas/${id}`)
  const item =
    response && typeof response === "object" && "data" in response
      ? ((response as Record<string, unknown>).data as Record<string, unknown>)
      : (response as Record<string, unknown>)
  const details = readArray<Record<string, unknown>>(item, [
    "detalles_venta",
    "detalles",
    "items",
  ])
  const payments = readArray<Record<string, unknown>>(item, ["pagos"]).map(
    normalizePayment
  )

  return {
    id: String(item.id_venta ?? item.id ?? ""),
    fecha: String(item.fecha_venta ?? ""),
    total: numberValue(item.total),
    activo: readActiveState(item),
    cliente: String(item.nombre_cliente ?? ""),
    nit: String(item.nit ?? ""),
    usuario: fullName(item.usuario),
    items: details.length,
    detalles: details.map((detail) => {
      const variant = detail.variante as Record<string, unknown> | undefined
      const cantidad = numberValue(detail.cantidad)
      const precioUnitario = numberValue(detail.precio_unitario)

      return {
        id: String(
          detail.id_detalle_venta ?? detail.id ?? variant?.id_variante ?? ""
        ),
        prenda: variantName(variant) || String(detail.descripcion ?? ""),
        sku: String(variant?.sku ?? ""),
        codigoBarras: String(
          variant?.codigo_barras ?? variant?.codigoBarras ?? ""
        ),
        cantidad,
        precioUnitario,
        subtotal: numberValue(detail.subtotal) || cantidad * precioUnitario,
      }
    }),
    pagos: payments,
  }
}

export async function cancelSale(input: { id: string; motivo: string }) {
  return request(`/ventas/${input.id}/anular`, {
    method: "PATCH",
    body: JSON.stringify({ motivo: input.motivo }),
  })
}

export async function fetchInventoryMovements(params: {
  page: number
  limit: number
  tipo?: string
}): Promise<PaginatedData<InventoryMovement>> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })

  if (params.tipo && params.tipo !== "all") {
    search.set("tipo", params.tipo)
  }

  const response = await request<unknown>(`/movimientos-inventarios?${search}`)
  const movements = readArray<Record<string, unknown>>(response).map((item) => {
    const variant = item.variante as Record<string, unknown> | undefined
    const product = variant?.producto as Record<string, unknown> | undefined
    const size = variant?.talla as Record<string, unknown> | undefined
    const color = variant?.color as Record<string, unknown> | undefined

    return {
      id: String(item.id_movimiento_inventario ?? item.id ?? ""),
      fecha: String(item.fecha_movimiento ?? ""),
      tipo: String(item.tipo ?? ""),
      origen: String(item.origen ?? ""),
      cantidad: numberValue(item.cantidad),
      motivo: String(item.motivo ?? ""),
      stockResultante: numberValue(item.stock_resultante),
      prenda: [product?.nombre, size?.nombre, color?.nombre]
        .filter(Boolean)
        .join(" / "),
      usuario: fullName(item.usuario),
    }
  })

  return toPaginated(response, movements, params)
}

export async function createInventoryAdjustment(input: {
  variante_id: string
  tipo: string
  cantidad: number
  motivo: string
}) {
  return request("/movimientos-inventarios/ajuste", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function fetchPayments(params: {
  page: number
  limit: number
}): Promise<PaginatedData<Payment>> {
  const search = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  const response = await request<unknown>(`/pagos?${search}`)
  const payments =
    readArray<Record<string, unknown>>(response).map(normalizePayment)

  return toPaginated(response, payments, params)
}
