import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  cancelPurchase,
  cancelSale,
  closeCashRegister,
  createInventoryAdjustment,
  createPurchase,
  fetchActiveCashRegister,
  fetchCashRegisters,
  fetchDashboard,
  fetchInventoryMovements,
  fetchPayments,
  fetchPurchases,
  fetchSales,
  openCashRegister,
} from "@/features/admin/services/adminService"
import { variantsQueryKey } from "@/features/inventario/hooks/useProducts"

export const adminKeys = {
  dashboard: ["admin-dashboard"],
  cash: ["admin-cash"],
  activeCash: ["admin-active-cash"],
  purchases: ["admin-purchases"],
  sales: ["admin-sales"],
  movements: ["admin-movements"],
  payments: ["admin-payments"],
}

export function useDashboard() {
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: fetchDashboard })
}

export function useCashRegisters(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...adminKeys.cash, params],
    queryFn: () => fetchCashRegisters(params),
  })
}

export function useActiveCashRegister() {
  return useQuery({
    queryKey: adminKeys.activeCash,
    queryFn: fetchActiveCashRegister,
  })
}

export function useOpenCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: openCashRegister,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.cash })
      void queryClient.invalidateQueries({ queryKey: adminKeys.activeCash })
    },
  })
}

export function useCloseCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: closeCashRegister,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.cash })
      void queryClient.invalidateQueries({ queryKey: adminKeys.activeCash })
    },
  })
}

export function usePurchases(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...adminKeys.purchases, params],
    queryFn: () => fetchPurchases(params),
  })
}

export function useCreatePurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.purchases })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
      void queryClient.invalidateQueries({ queryKey: adminKeys.movements })
    },
  })
}

export function useCancelPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelPurchase,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.purchases })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
      void queryClient.invalidateQueries({ queryKey: adminKeys.movements })
    },
  })
}

export function useSales(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...adminKeys.sales, params],
    queryFn: () => fetchSales(params),
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelSale,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.sales })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
      void queryClient.invalidateQueries({ queryKey: adminKeys.movements })
    },
  })
}

export function useInventoryMovements(params: {
  page: number
  limit: number
  tipo?: string
}) {
  return useQuery({
    queryKey: [...adminKeys.movements, params],
    queryFn: () => fetchInventoryMovements(params),
  })
}

export function useCreateInventoryAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createInventoryAdjustment,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.movements })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
    },
  })
}

export function usePayments(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...adminKeys.payments, params],
    queryFn: () => fetchPayments(params),
  })
}
