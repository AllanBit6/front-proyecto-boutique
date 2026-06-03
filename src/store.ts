import { create } from "zustand"

import {
  changePassword,
  getMe,
  login,
  logout as logoutRequest,
  type AuthUser,
} from "@/features/auth/services/authService"
import type { Role } from "@/shared/types/domain"

type AuthStatus = "idle" | "checking" | "authenticated" | "unauthenticated"

interface AuthState {
  user: AuthUser | null
  role: Role | null
  status: AuthStatus
  login: (input: { userName: string; password: string }) => Promise<AuthUser>
  changePassword: (input: {
    currentPassword: string
    newPassword: string
  }) => Promise<void>
  initializeSession: () => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  status: "idle",
  login: async (input) => {
    const user = await login(input)
    set({ user, role: user.role, status: "authenticated" })
    return user
  },
  changePassword: async (input) => {
    const changedUser = await changePassword(input)
    const user = changedUser ?? (await getMe())
    set({ user, role: user.role, status: "authenticated" })
  },
  initializeSession: async () => {
    if (get().status === "checking" || get().status === "authenticated") {
      return
    }

    set({ status: "checking" })

    try {
      const user = await getMe()
      set({ user, role: user.role, status: "authenticated" })
    } catch {
      set({ user: null, role: null, status: "unauthenticated" })
    }
  },
  logout: async () => {
    try {
      await logoutRequest()
    } finally {
      set({ user: null, role: null, status: "unauthenticated" })
    }
  },
}))
