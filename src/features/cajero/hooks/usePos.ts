import { useMutation, useQueryClient } from "@tanstack/react-query"

import { adminKeys } from "@/features/admin/hooks/useAdmin"
import { variantsQueryKey } from "@/features/inventario/hooks/useProducts"
import {
  createSale,
  fetchVariantByBarcode,
  type CreateSaleInput,
} from "@/features/cajero/services/posService"

export function useFindVariantByBarcode() {
  return useMutation({
    mutationFn: (code: string) => fetchVariantByBarcode(code),
  })
}

export function useCreateSale() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateSaleInput) => createSale(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminKeys.sales })
      void queryClient.invalidateQueries({ queryKey: adminKeys.dashboard })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
    },
  })
}
