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
  usuario: string
  items: number
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
  estado: string
  ventaId?: string
  cliente?: string
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
    const message = await response.text()
    throw new Error(message || "No se pudo completar la solicitud.")
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

function readArray<T>(response: unknown, keys: string[] = ["data", "items"]) {
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
      activo: Boolean(item.activo),
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
    activo: Boolean(item.activo),
    cliente: String(item.nombre_cliente ?? ""),
    usuario: fullName(item.usuario),
    items: numberValue(
      (item._count as Record<string, unknown>)?.detalles_venta
    ),
  }))

  return toPaginated(response, sales, params)
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
  const payments = readArray<Record<string, unknown>>(response).map((item) => {
    const sale = item.venta as Record<string, unknown> | undefined

    return {
      id: String(item.id_pago ?? item.id ?? ""),
      fecha: String(item.fecha_pago ?? ""),
      metodo: String(item.metodo ?? ""),
      monto: numberValue(item.monto),
      estado: String(item.estado ?? ""),
      ventaId: String(item.venta_id ?? sale?.id_venta ?? ""),
      cliente: String(sale?.nombre_cliente ?? ""),
    }
  })

  return toPaginated(response, payments, params)
}
