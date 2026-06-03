export interface RoleOption {
  id: string
  nombre: string
}

export interface User {
  id: string
  nombre: string
  apellido: string
  user_name: string
  rol_id: string
  rol_nombre: string
}

export interface UsersPageData {
  users: User[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface CreateUserInput {
  nombre: string
  apellido: string
  user_name: string
  password: string
  rol_id: string
}

export interface UpdateUserInput {
  nombre: string
  apellido: string
  user_name: string
  rol_id: string
}

export interface ResetPasswordInput {
  password_nuevo: string
}
