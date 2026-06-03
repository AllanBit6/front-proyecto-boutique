import { ChevronLeft, ChevronRight, Plus, Search, Settings2 } from "lucide-react"
import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarcodeDialog } from "@/features/inventario/components/BarcodeDialog"
import { CatalogManager } from "@/features/inventario/components/CatalogManager"
import { ProductForm } from "@/features/inventario/components/ProductForm"
import { ProductsTable } from "@/features/inventario/components/ProductsTable"
import { ProductWizardForm } from "@/features/inventario/components/ProductWizardForm"
import { VariantForm } from "@/features/inventario/components/VariantForm"
import { VariantsTable } from "@/features/inventario/components/VariantsTable"
import {
  useBrands,
  useColors,
  useDeleteProduct,
  useDeleteVariant,
  useProduct,
  useProducts,
  useSizes,
  useVariant,
  useVariants,
} from "@/features/inventario/hooks/useProducts"
import type { Product, Variant } from "@/features/inventario/types/product"

const PAGE_SIZE = 10
const CATALOG_LIMIT = 100

export function InventarioPage() {
  const [productsPage, setProductsPage] = useState(1)
  const [variantsPage, setVariantsPage] = useState(1)
  const [productSearch, setProductSearch] = useState("")
  const [productBrandFilter, setProductBrandFilter] = useState("all")
  const [variantSearch, setVariantSearch] = useState("")
  const [variantProductFilter, setVariantProductFilter] = useState("all")
  const [variantStockFilter, setVariantStockFilter] = useState("all")
  const [isRegisterProductOpen, setIsRegisterProductOpen] = useState(false)
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false)
  const [isCatalogManagerOpen, setIsCatalogManagerOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null)
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null)
  const [deleteVariant, setDeleteVariant] = useState<Variant | null>(null)
  const [barcodeVariant, setBarcodeVariant] = useState<Variant | null>(null)
  const productsQuery = useProducts({ page: productsPage, limit: PAGE_SIZE })
  const productOptionsQuery = useProducts({ page: 1, limit: CATALOG_LIMIT })
  const variantsQuery = useVariants({ page: variantsPage, limit: PAGE_SIZE })
  const brandsQuery = useBrands()
  const sizesQuery = useSizes()
  const colorsQuery = useColors()
  const editProductQuery = useProduct(editingProductId)
  const editVariantQuery = useVariant(editingVariantId)
  const deleteProductMutation = useDeleteProduct()
  const deleteVariantMutation = useDeleteVariant()
  const productsData = productsQuery.data
  const productOptions = productOptionsQuery.data?.data ?? productsData?.data ?? []
  const variantsData = variantsQuery.data
  const brands = brandsQuery.data ?? []
  const sizes = sizesQuery.data ?? []
  const colors = colorsQuery.data ?? []
  const filteredProducts = useMemo(
    () =>
      filterProducts(productsData?.data ?? [], {
        search: productSearch,
        brandId: productBrandFilter,
      }),
    [productBrandFilter, productSearch, productsData?.data]
  )
  const variantProductOptions = useMemo(
    () => getVariantProductOptions(variantsData?.data ?? []),
    [variantsData?.data]
  )
  const filteredVariants = useMemo(
    () =>
      filterVariants(variantsData?.data ?? [], {
        search: variantSearch,
        productId: variantProductFilter,
        stock: variantStockFilter,
      }),
    [variantProductFilter, variantSearch, variantStockFilter, variantsData?.data]
  )

  async function handleDeleteProduct() {
    if (!deleteProduct) {
      return
    }

    await deleteProductMutation.mutateAsync(deleteProduct.id)
    setDeleteProduct(null)
  }

  async function handleDeleteVariant() {
    if (!deleteVariant) {
      return
    }

    await deleteVariantMutation.mutateAsync(deleteVariant.id)
    setDeleteVariant(null)
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Inventario</h1>
            <p className="text-sm text-muted-foreground">
              Registra prendas listas para vender y administra tallas, colores,
              precios y codigos.
            </p>
          </div>
          <Button variant="outline" onClick={() => setIsCatalogManagerOpen(true)}>
            <Settings2 />
            Tallas y colores
          </Button>
        </div>

        <Tabs defaultValue="variantes">
          <TabsList>
            <TabsTrigger value="variantes">Prendas</TabsTrigger>
            <TabsTrigger value="productos">Modelos base</TabsTrigger>
          </TabsList>
          <TabsContent value="variantes" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Prendas</CardTitle>
                  <CardDescription>
                    Inventario vendible por talla, color, precio y codigo.
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button onClick={() => setIsRegisterProductOpen(true)}>
                    <Plus />
                    Registrar prenda
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateVariantOpen(true)}
                  >
                    <Plus />
                    Agregar talla/color
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_160px]">
                  <SearchInput
                    value={variantSearch}
                    onChange={setVariantSearch}
                    placeholder="Buscar prenda, talla, color, SKU o codigo"
                  />
                  <Select
                    value={variantProductFilter}
                    onValueChange={(value) =>
                      setVariantProductFilter(value ?? "all")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las prendas</SelectItem>
                      {variantProductOptions.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={variantStockFilter}
                    onValueChange={(value) =>
                      setVariantStockFilter(value ?? "all")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo inventario</SelectItem>
                      <SelectItem value="low">Necesita reposicion</SelectItem>
                      <SelectItem value="ok">Disponible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {variantsQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">
                    Cargando prendas...
                  </div>
                ) : variantsQuery.isError ? (
                  <div className="text-sm text-destructive">
                    No se pudieron cargar las prendas.
                  </div>
                ) : (
                  <VariantsTable
                    variants={filteredVariants}
                    onEdit={(variant) => setEditingVariantId(variant.id)}
                    onDelete={setDeleteVariant}
                    onBarcode={setBarcodeVariant}
                  />
                )}
                {variantsData ? (
                  <PaginationControls
                    page={variantsData.page}
                    totalPages={variantsData.totalPages}
                    total={variantsData.total}
                    visible={filteredVariants.length}
                    isFetching={variantsQuery.isFetching}
                    onPrevious={() =>
                      setVariantsPage((currentPage) => currentPage - 1)
                    }
                    onNext={() =>
                      setVariantsPage((currentPage) => currentPage + 1)
                    }
                  />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="productos" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Modelos base</CardTitle>
                  <CardDescription>
                    Agrupacion de prendas por nombre, marca y detalle.
                  </CardDescription>
                </div>
                <Button onClick={() => setIsRegisterProductOpen(true)}>
                  <Plus />
                  Registrar prenda
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_220px]">
                  <SearchInput
                    value={productSearch}
                    onChange={setProductSearch}
                    placeholder="Buscar modelo, detalle o marca"
                  />
                  <Select
                    value={productBrandFilter}
                    onValueChange={(value) =>
                      setProductBrandFilter(value ?? "all")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las marcas</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {productsQuery.isLoading ? (
                  <div className="text-sm text-muted-foreground">
                    Cargando modelos...
                  </div>
                ) : productsQuery.isError ? (
                  <div className="text-sm text-destructive">
                    No se pudieron cargar los modelos.
                  </div>
                ) : (
                  <ProductsTable
                    products={filteredProducts}
                    onEdit={(product) => setEditingProductId(product.id)}
                    onDelete={setDeleteProduct}
                  />
                )}
                {productsData ? (
                  <PaginationControls
                    page={productsData.page}
                    totalPages={productsData.totalPages}
                    total={productsData.total}
                    visible={filteredProducts.length}
                    isFetching={productsQuery.isFetching}
                    onPrevious={() =>
                      setProductsPage((currentPage) => currentPage - 1)
                    }
                    onNext={() =>
                      setProductsPage((currentPage) => currentPage + 1)
                    }
                  />
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <Dialog open={isRegisterProductOpen} onOpenChange={setIsRegisterProductOpen}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Registrar prenda</DialogTitle>
            <DialogDescription>
              Crea la prenda y su primera talla/color en un solo paso.
            </DialogDescription>
          </DialogHeader>
          <ProductWizardForm
            brands={brands}
            sizes={sizes}
            colors={colors}
            onSuccess={() => setIsRegisterProductOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateVariantOpen} onOpenChange={setIsCreateVariantOpen}>
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar talla/color</DialogTitle>
            <DialogDescription>
              Usa esta opcion cuando la prenda ya existe y solo necesitas otra
              presentacion.
            </DialogDescription>
          </DialogHeader>
          <VariantForm
            products={productOptions}
            sizes={sizes}
            colors={colors}
            onSuccess={() => setIsCreateVariantOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={isCatalogManagerOpen}
        onOpenChange={setIsCatalogManagerOpen}
      >
        <DialogContent className="max-h-[88svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tallas y colores</DialogTitle>
            <DialogDescription>
              Agrega opciones para usarlas al registrar prendas.
            </DialogDescription>
          </DialogHeader>
          <CatalogManager sizes={sizes} colors={colors} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingProductId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingProductId(null)
          }
        }}
      >
        <DialogContent className="max-h-[88svh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar modelo base</DialogTitle>
            <DialogDescription>
              Actualiza nombre, detalle y marca.
            </DialogDescription>
          </DialogHeader>
          {editProductQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando modelo...
            </div>
          ) : editProductQuery.data ? (
            <ProductForm
              brands={brands}
              product={editProductQuery.data}
              onSuccess={() => setEditingProductId(null)}
            />
          ) : (
            <div className="text-sm text-destructive">
              No se pudo cargar el modelo.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingVariantId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingVariantId(null)
          }
        }}
      >
        <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar presentacion</DialogTitle>
            <DialogDescription>
              Actualiza talla/color, precios, SKU y alerta de stock.
            </DialogDescription>
          </DialogHeader>
          {editVariantQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando presentacion...
            </div>
          ) : editVariantQuery.data ? (
            <VariantForm
              products={productOptions}
              sizes={sizes}
              colors={colors}
              variant={editVariantQuery.data}
              onSuccess={() => setEditingVariantId(null)}
            />
          ) : (
            <div className="text-sm text-destructive">
              No se pudo cargar la presentacion.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BarcodeDialog
        open={Boolean(barcodeVariant)}
        variant={barcodeVariant}
        onOpenChange={(open) => {
          if (!open) {
            setBarcodeVariant(null)
          }
        }}
      />

      <ConfirmDeactivateDialog
        open={Boolean(deleteProduct)}
        title="Desactivar modelo"
        description={`Esta accion desactivara ${deleteProduct?.nombre ?? ""}.`}
        isPending={deleteProductMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProduct(null)
          }
        }}
        onConfirm={() => void handleDeleteProduct()}
      />

      <ConfirmDeactivateDialog
        open={Boolean(deleteVariant)}
        title="Desactivar presentacion"
        description={`Esta accion desactivara ${deleteVariant?.sku ?? ""}.`}
        isPending={deleteVariantMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteVariant(null)
          }
        }}
        onConfirm={() => void handleDeleteVariant()}
      />
    </>
  )
}

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-8"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}

function PaginationControls({
  page,
  totalPages,
  total,
  visible,
  isFetching,
  onPrevious,
  onNext,
}: {
  page: number
  totalPages: number
  total: number
  visible: number
  isFetching: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {visible} visibles de {total} registros - Pagina {page} de {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1 || isFetching}
          onClick={onPrevious}
        >
          <ChevronLeft />
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages || isFetching}
          onClick={onNext}
        >
          Siguiente
          <ChevronRight />
        </Button>
      </div>
    </div>
  )
}

function ConfirmDeactivateDialog({
  open,
  title,
  description,
  isPending,
  onOpenChange,
  onConfirm,
}: {
  open: boolean
  title: string
  description: string
  isPending: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description} No se elimina de la base de datos; el backend aplica
            borrado logico.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Desactivando..." : "Desactivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase()
}

function includesSearch(values: string[], search: string) {
  const normalizedSearch = normalizeText(search)

  if (!normalizedSearch) {
    return true
  }

  return values.some((value) => normalizeText(value).includes(normalizedSearch))
}

function filterProducts(
  products: Product[],
  filters: { search: string; brandId: string }
) {
  return products.filter((product) => {
    const matchesSearch = includesSearch(
      [product.nombre, product.caracteristica_distintiva, product.marca_nombre],
      filters.search
    )
    const matchesBrand =
      filters.brandId === "all" || product.marca_id === filters.brandId

    return matchesSearch && matchesBrand
  })
}

function filterVariants(
  variants: Variant[],
  filters: { search: string; productId: string; stock: string }
) {
  return variants.filter((variant) => {
    const matchesSearch = includesSearch(
      [
        variant.sku,
        variant.codigo_barras,
        variant.producto_nombre,
        variant.talla_nombre,
        variant.color_nombre,
      ],
      filters.search
    )
    const matchesProduct =
      filters.productId === "all" || variant.producto_id === filters.productId
    const lowStock = variant.stock_actual <= variant.stock_minimo
    const matchesStock =
      filters.stock === "all" ||
      (filters.stock === "low" && lowStock) ||
      (filters.stock === "ok" && !lowStock)

    return matchesSearch && matchesProduct && matchesStock
  })
}

function getVariantProductOptions(variants: Variant[]) {
  const products = new Map<string, string>()

  for (const variant of variants) {
    if (variant.producto_id) {
      products.set(variant.producto_id, variant.producto_nombre)
    }
  }

  return [...products.entries()].map(([id, nombre]) => ({ id, nombre }))
}
