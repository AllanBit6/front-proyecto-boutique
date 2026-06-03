import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type {
  CreateUserInput,
  ResetPasswordInput,
  UpdateUserInput,
} from "@/features/usuarios/types/user"
import {
  createUser,
  deleteUser,
  fetchRoles,
  fetchUser,
  fetchUsers,
  resetPassword,
  updateUser,
} from "@/features/usuarios/services/usersService"

export const usersQueryKey = ["usuarios"]
export const rolesQueryKey = ["roles"]

export function useUsers(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...usersQueryKey, params],
    queryFn: () => fetchUsers(params),
  })
}

export function useUser(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...usersQueryKey, id],
    queryFn: () => fetchUser(id!),
  })
}

export function useRoles() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: fetchRoles,
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; input: UpdateUserInput }) =>
      updateUser(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: usersQueryKey })
    },
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (params: { id: string; input: ResetPasswordInput }) =>
      resetPassword(params),
  })
}
