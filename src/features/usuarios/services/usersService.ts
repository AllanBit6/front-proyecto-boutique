import type {
  CreateUserInput,
  ResetPasswordInput,
  RoleOption,
  UpdateUserInput,
  User,
  UsersPageData,
} from "@/features/usuarios/types/user"

interface ApiRole {
  id?: string
  id_rol?: string
  nombre?: string
  name?: string
}

interface ApiUser {
  id: string
  nombre?: string
  apellido?: string
  user_name?: string
  rol_id?: string
  rol?: ApiRole | string
  role?: ApiRole | string
}

interface PaginationMeta {
  page?: number
  pagina?: number
  current_page?: number
  limit?: number
  per_page?: number
  total?: number
  totalPages?: number
  total_pages?: number
}

const API_URL = import.meta.env.VITE_API_URL ?? ""

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

function normalizeRole(role: ApiRole): RoleOption {
  const id = role.id_rol ?? role.id ?? ""
  const name = role.nombre ?? role.name ?? id

  return {
    id,
    nombre: friendlyRoleName(name),
  }
}

function friendlyRoleName(role: string) {
  const normalizedRole = role.trim().toLocaleLowerCase()

  if (normalizedRole === "administrador" || normalizedRole === "admin") {
    return "Administrador"
  }

  if (normalizedRole === "vendedor" || normalizedRole === "cashier") {
    return "Vendedor"
  }

  if (normalizedRole === "bodeguero" || normalizedRole === "warehouse") {
    return "Bodega"
  }

  return role
}

function normalizeUser(user: ApiUser): User {
  const role = typeof user.rol === "object" ? user.rol : undefined
  const fallbackRole = typeof user.role === "object" ? user.role : undefined
  const roleEntity = role ?? fallbackRole
  const roleName =
    roleEntity?.nombre ??
    roleEntity?.name ??
    (typeof user.rol === "string" ? user.rol : undefined) ??
    (typeof user.role === "string" ? user.role : undefined) ??
    ""

  return {
    id: user.id,
    nombre: user.nombre ?? "",
    apellido: user.apellido ?? "",
    user_name: user.user_name ?? "",
    rol_id: user.rol_id ?? roleEntity?.id ?? "",
    rol_nombre: friendlyRoleName(roleName),
  }
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

function readMeta(response: unknown): PaginationMeta {
  if (!response || typeof response !== "object") {
    return {}
  }

  const record = response as Record<string, unknown>
  const meta = record.meta ?? record.pagination ?? record.data

  if (meta && typeof meta === "object" && !Array.isArray(meta)) {
    return meta as PaginationMeta
  }

  return record as PaginationMeta
}

export async function fetchUsers(params: {
  page: number
  limit: number
}): Promise<UsersPageData> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  })
  const response = await request<unknown>(`/usuarios?${searchParams}`)
  const meta = readMeta(response)
  const users = readArray<ApiUser>(response, [
    "usuarios",
    "users",
    "items",
  ]).map(normalizeUser)
  const page = meta.page ?? meta.pagina ?? meta.current_page ?? params.page
  const limit = meta.limit ?? meta.per_page ?? params.limit
  const total = meta.total ?? users.length
  const totalPages =
    meta.totalPages ?? meta.total_pages ?? Math.max(1, Math.ceil(total / limit))

  return {
    users,
    page,
    limit,
    total,
    totalPages,
  }
}

export async function fetchUser(id: string): Promise<User> {
  const response = await request<ApiUser>(`/usuarios/${id}`)

  return normalizeUser(response)
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const response = await request<ApiUser>("/usuarios", {
    method: "POST",
    body: JSON.stringify(input),
  })

  return normalizeUser(response)
}

export async function updateUser({
  id,
  input,
}: {
  id: string
  input: UpdateUserInput
}): Promise<User> {
  const response = await request<ApiUser>(`/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })

  return normalizeUser(response)
}

export async function deleteUser(id: string): Promise<void> {
  await request<void>(`/usuarios/${id}`, {
    method: "DELETE",
  })
}

export async function resetPassword({
  id,
  input,
}: {
  id: string
  input: ResetPasswordInput
}): Promise<void> {
  await request<void>(`/usuarios/${id}/reset-password`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function fetchRoles(): Promise<RoleOption[]> {
  const response = await request<unknown>("/roles")

  return readArray<ApiRole>(response, ["roles", "items"])
    .map(normalizeRole)
    .filter((role) => role.id)
}
