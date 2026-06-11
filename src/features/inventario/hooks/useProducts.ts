import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import {
  type CatalogQueryParams,
  createProduct,
  createBrand,
  createColor,
  createVariant,
  createSize,
  deleteBrand,
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
  Product,
  Variant,
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

export function useAllProducts() {
  return useQuery({
    queryKey: [...productsQueryKey, "all"],
    queryFn: async () => {
      const limit = 100
      const firstPage = await fetchProducts({ page: 1, limit })
      const products = [...firstPage.data]

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await fetchProducts({ page, limit })
        products.push(...nextPage.data)
      }

      const uniqueProducts = new Map<string, Product>()

      for (const product of products) {
        uniqueProducts.set(product.id, product)
      }

      return Array.from(uniqueProducts.values())
    },
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

export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: brandsQueryKey })
      void queryClient.invalidateQueries({ queryKey: productsQueryKey })
      void queryClient.invalidateQueries({ queryKey: variantsQueryKey })
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

export function useAllVariants() {
  return useQuery({
    queryKey: [...variantsQueryKey, "all"],
    queryFn: async () => {
      const limit = 100
      const firstPage = await fetchVariants({ page: 1, limit })
      const variants = [...firstPage.data]

      for (let page = 2; page <= firstPage.totalPages; page += 1) {
        const nextPage = await fetchVariants({ page, limit })
        variants.push(...nextPage.data)
      }

      const uniqueVariants = new Map<string, Variant>()

      for (const variant of variants) {
        uniqueVariants.set(variant.id, variant)
      }

      return Array.from(uniqueVariants.values())
    },
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
