import type { Role } from "@/shared/types/domain"
import { apiUrl } from "@/shared/utils/apiClient"
import { readSafeApiError } from "@/shared/utils/apiErrors"

export interface AuthUser {
  id: string
  name: string
  userName: string
  role: Role
  firstLogin: boolean
}

interface ApiLoginUser {
  id: string
  nombre?: string
  apellido?: string
  user_name: string
  rol: string
  primer_login: boolean
}

interface LoginResponse {
  usuario: ApiLoginUser
}

interface ChangePasswordResponse {
  usuario?: ApiLoginUser
}

function toAuthUser(user: ApiLoginUser): AuthUser {
  return {
    id: user.id,
    name:
      [user.nombre, user.apellido].filter(Boolean).join(" ") || user.user_name,
    userName: user.user_name,
    role: mapRole(user.rol),
    firstLogin: user.primer_login,
  }
}

function mapRole(role: string): Role {
  if (role === "administrador" || role === "admin") {
    return "admin"
  }

  if (role === "bodeguero" || role === "warehouse") {
    return "warehouse"
  }

  return "cashier"
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
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

  return response.json() as Promise<T>
}

export async function login(input: {
  userName: string
  password: string
}): Promise<AuthUser> {
  const response = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      user_name: input.userName,
      password: input.password,
    }),
  })

  return toAuthUser(response.usuario)
}

export async function changePassword(input: {
  currentPassword: string
  newPassword: string
}): Promise<AuthUser | null> {
  const response = await request<ChangePasswordResponse>(
    "/usuarios/change-password",
    {
      method: "PATCH",
      body: JSON.stringify({
        password_actual: input.currentPassword,
        password_nuevo: input.newPassword,
      }),
    }
  )

  return response.usuario ? toAuthUser(response.usuario) : null
}

export async function logout(): Promise<void> {
  await fetch(apiUrl("/auth/logout"), {
    credentials: "include",
    method: "POST",
  })
}

export async function getMe(): Promise<AuthUser> {
  const user = await request<ApiLoginUser>("/auth/me")

  return toAuthUser(user)
}
