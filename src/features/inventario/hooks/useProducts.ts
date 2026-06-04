import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  type CatalogQueryParams,
  createProduct,
  createBrand,
  createColor,
  createVariant,
  createSize,
  deleteProduct,
  deleteColor,
  deleteSize,
  deleteVariant,
  fetchBrands,
  fetchColors,
  fetchProduct,
  fetchProducts,
  fetchSizes,
  fetchVariant,
  fetchVariants,
  updateProduct,
  updateVariant,
} from "@/features/inventario/services/productsService"
import type {
  CreateProductInput,
  CreateBrandInput,
  CreateCatalogInput,
  CreateVariantInput,
  UpdateProductInput,
  UpdateVariantInput,
} from "@/features/inventario/types/product"

export const productsQueryKey = ["productos"]
export const variantsQueryKey = ["variantes"]
export const brandsQueryKey = ["marcas"]
export const sizesQueryKey = ["tallas"]
export const colorsQueryKey = ["colores"]

export function useProducts(params: CatalogQueryParams) {
  return useQuery({
    queryKey: [...productsQueryKey, params],
    queryFn: () => fetchProducts(params),
  })
}

export function useProduct(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...productsQueryKey, id],
    queryFn: () => fetchProduct(id!),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateProductInput) => createProduct(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKey })
    },
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateBrandInput) => createBrand(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: brandsQueryKey })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; input: UpdateProductInput }) =>
      updateProduct(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKey })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: productsQueryKey })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
    },
  })
}

export function useVariants(params: CatalogQueryParams) {
  return useQuery({
    queryKey: [...variantsQueryKey, params],
    queryFn: () => fetchVariants(params),
  })
}

export function useVariant(id: string | null) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: [...variantsQueryKey, id],
    queryFn: () => fetchVariant(id!),
  })
}

export function useCreateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateVariantInput) => createVariant(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
    },
  })
}

export function useUpdateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: { id: string; input: UpdateVariantInput }) =>
      updateVariant(params),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
    },
  })
}

export function useDeleteVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteVariant(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
    },
  })
}

export function useBrands(enabled = true) {
  return useQuery({
    enabled,
    queryKey: brandsQueryKey,
    queryFn: fetchBrands,
  })
}

export function useSizes(enabled = true) {
  return useQuery({
    enabled,
    queryKey: sizesQueryKey,
    queryFn: fetchSizes,
  })
}

export function useColors(enabled = true) {
  return useQuery({
    enabled,
    queryKey: colorsQueryKey,
    queryFn: fetchColors,
  })
}

export function useCreateSize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCatalogInput) => createSize(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sizesQueryKey })
    },
  })
}

export function useDeleteSize() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSize(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: sizesQueryKey })
    },
  })
}

export function useCreateColor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateCatalogInput) => createColor(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: colorsQueryKey })
    },
  })
}

export function useDeleteColor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteColor(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: colorsQueryKey })
    },
  })
}
