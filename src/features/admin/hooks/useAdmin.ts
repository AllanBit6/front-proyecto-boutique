import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  cancelPurchase,
  cancelSale,
  type CashRegister,
  closeCashRegister,
  createInventoryAdjustment,
  createPurchase,
  fetchActiveCashRegister,
  fetchCashRegisterDetail,
  fetchCashRegisters,
  fetchDashboard,
  fetchInventoryMovements,
  fetchPaymentDetail,
  fetchPayments,
  fetchPurchases,
  fetchSaleDetail,
  fetchSales,
  openCashRegister,
  type PaginatedData,
} from "@/features/admin/services/adminService"
import { variantsQueryKey } from "@/features/inventario/hooks/useProducts"

export const adminKeys = {
  dashboard: ["admin-dashboard"],
  cash: ["admin-cash"],
  activeCash: ["admin-active-cash"],
  cashDetail: ["admin-cash-detail"],
  purchases: ["admin-purchases"],
  sales: ["admin-sales"],
  saleDetail: ["admin-sale-detail"],
  movements: ["admin-movements"],
  payments: ["admin-payments"],
  paymentDetail: ["admin-payment-detail"],
}

export function useDashboard() {
  return useQuery({ queryKey: adminKeys.dashboard, queryFn: fetchDashboard })
}

export function useCashRegisters(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...adminKeys.cash, params],
    queryFn: () => fetchCashRegisters(params),
    staleTime: 0,
    refetchOnMount: "always",
  })
}

export function useActiveCashRegister() {
  return useQuery({
    queryKey: adminKeys.activeCash,
    queryFn: fetchActiveCashRegister,
    staleTime: 0,
    refetchOnMount: "always",
  })
}

export function useCashRegisterDetail(id?: string) {
  return useQuery({
    queryKey: [...adminKeys.cashDetail, id],
    queryFn: () => fetchCashRegisterDetail(id ?? ""),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
  })
}

function upsertCashRegister(
  current: PaginatedData<CashRegister> | undefined,
  cash: CashRegister
) {
  if (!current) {
    return current
  }

  const exists = current.data.some((item) => item.id === cash.id)
  const data = exists
    ? current.data.map((item) => (item.id === cash.id ? cash : item))
    : [cash, ...current.data].slice(0, current.limit)

  return {
    ...current,
    data,
    total: exists ? current.total : current.total + 1,
    totalPages: Math.max(
      current.totalPages,
      Math.ceil((exists ? current.total : current.total + 1) / current.limit)
    ),
  }
}

export function useOpenCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: openCashRegister,
    onSuccess: (cash) => {
      queryClient.setQueryData([...adminKeys.cashDetail, cash.id], cash)
      queryClient.setQueryData(adminKeys.activeCash, cash)
      queryClient.setQueriesData<PaginatedData<CashRegister>>(
        { queryKey: adminKeys.cash },
        (current) => upsertCashRegister(current, cash)
      )
      void queryClient.invalidateQueries({ queryKey: adminKeys.cash })
      void queryClient.invalidateQueries({ queryKey: adminKeys.activeCash })
    },
  })
}

export function useCloseCashRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: closeCashRegister,
    onSuccess: (cash) => {
      queryClient.setQueryData([...adminKeys.cashDetail, cash.id], cash)
      queryClient.setQueriesData<PaginatedData<CashRegister>>(
        { queryKey: adminKeys.cash },
        (current) => upsertCashRegister(current, cash)
      )
      void queryClient.invalidateQueries({ queryKey: adminKeys.cash })
      void queryClient.invalidateQueries({ queryKey: adminKeys.activeCash })
      void queryClient.invalidateQueries({ queryKey: adminKeys.cashDetail })
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.purchases }),
        queryClient.invalidateQueries({ queryKey: variantsQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminKeys.movements }),
        queryClient.invalidateQueries({ queryKey: adminKeys.dashboard }),
      ])
    },
  })
}

export function useCancelPurchase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelPurchase,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.purchases }),
        queryClient.invalidateQueries({ queryKey: variantsQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminKeys.movements }),
        queryClient.invalidateQueries({ queryKey: adminKeys.dashboard }),
      ])
    },
  })
}

export function useSales(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...adminKeys.sales, params],
    queryFn: () => fetchSales(params),
  })
}

export function useSaleDetail(id?: string) {
  return useQuery({
    queryKey: [...adminKeys.saleDetail, id],
    queryFn: () => fetchSaleDetail(id ?? ""),
    enabled: Boolean(id),
  })
}

export function useCancelSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelSale,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.sales })
      void queryClient.invalidateQueries({ queryKey: adminKeys.payments })
      void queryClient.invalidateQueries({ queryKey: adminKeys.cash })
      void queryClient.invalidateQueries({ queryKey: adminKeys.activeCash })
      void queryClient.invalidateQueries({ queryKey: adminKeys.cashDetail })
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard })
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
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.movements }),
        queryClient.invalidateQueries({ queryKey: variantsQueryKey }),
        queryClient.invalidateQueries({ queryKey: adminKeys.dashboard }),
      ])
    },
  })
}

export function usePayments(params: { page: number; limit: number }) {
  return useQuery({
    queryKey: [...adminKeys.payments, params],
    queryFn: () => fetchPayments(params),
  })
}

export function usePaymentDetail(id?: string) {
  return useQuery({
    queryKey: [...adminKeys.paymentDetail, id],
    queryFn: () => fetchPaymentDetail(id ?? ""),
    enabled: Boolean(id),
  })
}
