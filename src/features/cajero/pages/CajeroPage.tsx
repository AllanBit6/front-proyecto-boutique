import {
  Minus,
  Plus,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  useActiveCashRegister,
  useCashRegisters,
} from "@/features/admin/hooks/useAdmin"
import { AdminPager } from "@/features/admin/components/AdminTable"
import { formatCurrency } from "@/features/admin/utils/formatters"
import {
  useAllVariants,
  useVariants,
} from "@/features/inventario/hooks/useProducts"
import type { Variant } from "@/features/inventario/types/product"
import { useFindVariantByBarcode } from "@/features/cajero/hooks/usePos"
import { normalizeCodeInput, normalizeTextInput } from "@/shared/utils/security"
import { useAuthStore } from "@/store"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  LoadTransition,
  TableSkeleton,
} from "@/components/ui/loading-skeletons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PaymentForm } from "@/features/cajero/components/PaymentForm"
import type { CartItem } from "@/features/cajero/types/posTypes"
import { variantLabel } from "@/features/cajero/helpers/posHelpers"

const PRODUCT_PAGE_SIZE = 10

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase()
}

function playScanBeep() {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof window.AudioContext })
      .webkitAudioContext

  if (!AudioContextCtor) {
    return
  }

  const audioContext = new AudioContextCtor()
  const mainOscillator = audioContext.createOscillator()
  const accentOscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const now = audioContext.currentTime

  mainOscillator.type = "triangle"
  mainOscillator.frequency.setValueAtTime(1046.5, now)
  accentOscillator.type = "sine"
  accentOscillator.frequency.setValueAtTime(1318.5, now + 0.08)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22)
  mainOscillator.connect(gain)
  accentOscillator.connect(gain)
  gain.connect(audioContext.destination)
  mainOscillator.start(now)
  mainOscillator.stop(now + 0.2)
  accentOscillator.start(now + 0.08)
  accentOscillator.stop(now + 0.22)
  accentOscillator.onended = () => void audioContext.close()
}

function playSaleSuccess() {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof window.AudioContext })
      .webkitAudioContext

  if (!AudioContextCtor) {
    return
  }

  const audioContext = new AudioContextCtor()
  const primaryOsc = audioContext.createOscillator()
  const secondaryOsc = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const now = audioContext.currentTime

  primaryOsc.type = "triangle"
  secondaryOsc.type = "sine"
  primaryOsc.frequency.setValueAtTime(880, now)
  primaryOsc.frequency.exponentialRampToValueAtTime(1320, now + 0.12)
  secondaryOsc.frequency.setValueAtTime(1320, now)
  secondaryOsc.frequency.exponentialRampToValueAtTime(1760, now + 0.12)

  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.09)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25)

  primaryOsc.connect(gain)
  secondaryOsc.connect(gain)
  gain.connect(audioContext.destination)

  primaryOsc.start(now)
  secondaryOsc.start(now)
  primaryOsc.stop(now + 0.25)
  secondaryOsc.stop(now + 0.25)
  primaryOsc.onended = () => void audioContext.close()
}

export function CajeroPage() {
  const user = useAuthStore((state) => state.user)
  const [barcode, setBarcode] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [sizeFilter, setSizeFilter] = useState("all")
  const [colorFilter, setColorFilter] = useState("all")
  const [variantsPage, setVariantsPage] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [error, setError] = useState("")
  const barcodeInputRef = useRef<HTMLInputElement>(null)
  const [shouldFocusBarcode, setShouldFocusBarcode] = useState(true)
  const variantsQuery = useVariants({
    page: variantsPage,
    limit: PRODUCT_PAGE_SIZE,
  })
  const variantFiltersQuery = useAllVariants()
  const activeCashQuery = useActiveCashRegister()
  const cashRegistersQuery = useCashRegisters({ page: 1, limit: 100 })
  const findByBarcode = useFindVariantByBarcode()
  const ownActiveCash = useMemo(() => {
    const fromList = cashRegistersQuery.data?.data.find(
      (item) => item.activo && item.usuarioId === user?.id
    )

    if (fromList) {
      return fromList
    }

    const activeCash = activeCashQuery.data

    if (activeCash?.activo && activeCash.usuarioId === user?.id) {
      return activeCash
    }

    return null
  }, [activeCashQuery.data, cashRegistersQuery.data?.data, user?.id])
  const isCheckingCash =
    activeCashQuery.isLoading || cashRegistersQuery.isLoading
  const canSell = Boolean(ownActiveCash)
  const sellableVariants = useMemo(
    () =>
      (variantsQuery.data?.data ?? []).filter(
        (variant) => variant.activo && variant.stock_actual > 0
      ),
    [variantsQuery.data?.data]
  )
  const filterableVariants = useMemo(
    () =>
      (variantFiltersQuery.data ?? []).filter(
        (variant) => variant.activo && variant.stock_actual > 0
      ),
    [variantFiltersQuery.data]
  )
  const sizeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          filterableVariants
            .map((variant) => variant.talla_nombre)
            .filter(Boolean)
        )
      ).sort(),
    [filterableVariants]
  )
  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          filterableVariants
            .map((variant) => variant.color_nombre)
            .filter(Boolean)
        )
      ).sort(),
    [filterableVariants]
  )
  const filteredVariants = useMemo(() => {
    const terms = normalizeSearch(productSearch).split(" ").filter(Boolean)

    return sellableVariants.filter((variant) => {
      if (sizeFilter !== "all" && variant.talla_nombre !== sizeFilter) {
        return false
      }

      if (colorFilter !== "all" && variant.color_nombre !== colorFilter) {
        return false
      }

      const searchable = normalizeSearch(
        [
          variant.producto_nombre,
          variant.marca_nombre,
          variant.talla_nombre,
          variant.color_nombre,
          variant.sku,
          variant.codigo_barras,
          formatCurrency(variant.precio_venta),
        ].join(" ")
      )

      return terms.every((term) => searchable.includes(term))
    })
  }, [colorFilter, productSearch, sellableVariants, sizeFilter])
  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.quantity * item.variant.precio_venta,
        0
      ),
    [cart]
  )

  useEffect(() => {
    if (findByBarcode.isPending || !shouldFocusBarcode) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      barcodeInputRef.current?.focus()
      barcodeInputRef.current?.select()
      setShouldFocusBarcode(false)
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [findByBarcode.isPending, shouldFocusBarcode])

  function requestBarcodeFocus() {
    setShouldFocusBarcode(true)
  }

  function addVariant(variant: Variant) {
    setError("")

    if (!variant.activo || variant.stock_actual <= 0) {
      setError("La variante no tiene stock disponible.")
      toast.error("La prenda no tiene stock disponible.")
      return false
    }

    let added = true

    setCart((current) => {
      const existing = current.find((item) => item.variant.id === variant.id)

      if (existing) {
        if (existing.quantity >= variant.stock_actual) {
          setError("No puedes vender mas que el stock actual.")
          toast.warning("No puedes vender mas que el stock actual.")
          added = false
          return current
        }

        return current.map((item) =>
          item.variant.id === variant.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...current, { variant, quantity: 1 }]
    })

    return added
  }

  function updateQuantity(variantId: string, quantity: number) {
    setError("")
    const nextQuantity = Math.max(
      1,
      Math.trunc(Number.isFinite(quantity) ? quantity : 1)
    )
    setCart((current) =>
      current
        .map((item) => {
          if (item.variant.id !== variantId) {
            return item
          }

          return {
            ...item,
            quantity: Math.min(nextQuantity, item.variant.stock_actual),
          }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  function handleProductSelect(variant: Variant) {
    if (addVariant(variant)) {
      toast.success(`${variantLabel(variant)} agregado al carrito.`)
    }
    requestBarcodeFocus()
  }

  async function handleBarcodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = normalizeCodeInput(barcode)

    if (!code) {
      requestBarcodeFocus()
      return
    }

    try {
      const variant = await findByBarcode.mutateAsync(code)
      if (addVariant(variant)) {
        playScanBeep()
        toast.success(`${variantLabel(variant)} agregado al carrito.`)
      }
      setBarcode("")
    } catch (exception) {
      const message =
        exception instanceof Error
          ? exception.message
          : "No se encontró el código."
      setError(message)
      toast.error(message)
    } finally {
      requestBarcodeFocus()
    }
  }

  function handleSuccess() {
    playSaleSuccess()
    setCart([])
    setPaymentOpen(false)
    requestBarcodeFocus()
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-heading">Venta de mostrador</h1>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {!isCheckingCash && !canSell ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
          Caja cerrada. Abre caja antes de finalizar ventas.
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(220px,300px)_minmax(260px,1fr)_160px_160px]">
                <form
                  className="flex min-w-0 gap-2"
                  onSubmit={handleBarcodeSubmit}
                >
                  <Input
                    ref={barcodeInputRef}
                    className="min-w-0"
                    value={barcode}
                    onChange={(event) =>
                      setBarcode(normalizeCodeInput(event.target.value))
                    }
                    placeholder="Código"
                    autoComplete="off"
                    maxLength={64}
                    disabled={findByBarcode.isPending}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    aria-label="Buscar código"
                    disabled={findByBarcode.isPending}
                  >
                    <ScanBarcode />
                  </Button>
                </form>
                <div className="relative min-w-0">
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="min-w-0 pl-9"
                    value={productSearch}
                    onChange={(event) => {
                      setProductSearch(
                        normalizeTextInput(event.target.value, {
                          maxLength: 80,
                        })
                      )
                      setVariantsPage(1)
                    }}
                    placeholder="Buscar producto"
                    maxLength={80}
                    disabled={variantsQuery.isLoading}
                  />
                </div>
                <Select
                  value={sizeFilter}
                  onValueChange={(value) => {
                    setSizeFilter(value ?? "all")
                    setVariantsPage(1)
                  }}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <span className="truncate">
                      {sizeFilter === "all" ? "Todas las tallas" : sizeFilter}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las tallas</SelectItem>
                    {sizeOptions.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={colorFilter}
                  onValueChange={(value) => {
                    setColorFilter(value ?? "all")
                    setVariantsPage(1)
                  }}
                >
                  <SelectTrigger className="w-full min-w-0">
                    <span className="truncate">
                      {colorFilter === "all"
                        ? "Todos los colores"
                        : colorFilter}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los colores</SelectItem>
                    {colorOptions.map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-xs text-muted-foreground">
                {filteredVariants.length} visibles de{" "}
                {variantsQuery.data?.total ?? 0} registros
              </div>

              {variantsQuery.isLoading ? (
                <TableSkeleton columns={6} rows={5} />
              ) : variantsQuery.isError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-8 text-center text-sm text-destructive">
                  No se pudieron cargar los productos.
                </div>
              ) : filteredVariants.length > 0 ? (
                <LoadTransition>
                  <div className="max-h-[360px] overflow-auto rounded-md border">
                    <Table className="min-w-[560px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="hidden md:table-cell">
                            SKU
                          </TableHead>
                          <TableHead>Prenda</TableHead>
                          <TableHead>Talla / color</TableHead>
                          <TableHead className="text-right">Precio</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead className="w-28" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredVariants.map((variant) => {
                          const cartQuantity =
                            cart.find((item) => item.variant.id === variant.id)
                              ?.quantity ?? 0
                          const available = variant.stock_actual - cartQuantity
                          const canAdd = available > 0

                          return (
                            <TableRow key={variant.id}>
                              <TableCell className="hidden font-medium md:table-cell">
                                {variant.sku || variant.codigo_barras || "-"}
                              </TableCell>
                              <TableCell className="max-w-48 whitespace-normal">
                                <div className="font-medium">
                                  {variant.producto_nombre || "-"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {variant.marca_nombre || ""}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {variant.codigo_barras ||
                                    variant.sku ||
                                    "Sin código de barras"}
                                </div>
                              </TableCell>
                              <TableCell>
                                {variant.talla_nombre || "-"} /{" "}
                                {variant.color_nombre || "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatCurrency(variant.precio_venta)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={canAdd ? "secondary" : "outline"}
                                >
                                  {available} disp.
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={!canAdd}
                                  onClick={() => handleProductSelect(variant)}
                                >
                                  <Plus />
                                  Agregar
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </LoadTransition>
              ) : (
                <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                  Sin resultados.
                </div>
              )}
              {variantsQuery.data ? (
                <AdminPager
                  page={variantsQuery.data.page}
                  totalPages={variantsQuery.data.totalPages}
                  total={variantsQuery.data.total}
                  disabled={variantsQuery.isFetching}
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
        </div>

        <div className="space-y-4">
          <Card className="xl:sticky xl:top-18 xl:self-start">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="size-4 text-primary" />
                  Carrito
                </CardTitle>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={cart.length === 0}
                onClick={() => setCart([])}
              >
                <Trash2 />
                Vaciar carrito
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {cart.length > 0 ? (
                <div className="rounded-md border">
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prenda</TableHead>
                        <TableHead className="hidden md:table-cell">
                          Código
                        </TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Stock
                        </TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <Fragment key={item.variant.id}>
                          <TableRow className="border-b-0">
                            <TableCell className="max-w-48 whitespace-normal">
                              <div className="font-medium">
                                {variantLabel(item.variant)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.variant.marca_nombre || ""}
                              </div>
                              <div className="text-xs text-muted-foreground md:hidden">
                                {item.variant.sku ||
                                  item.variant.codigo_barras ||
                                  "Sin código"}
                              </div>
                              <div className="text-xs text-muted-foreground sm:hidden">
                                Stock: {item.variant.stock_actual}
                              </div>
                            </TableCell>
                            <TableCell className="hidden text-muted-foreground md:table-cell">
                              {item.variant.sku ||
                                item.variant.codigo_barras ||
                                "-"}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(item.variant.precio_venta)}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              {item.variant.stock_actual}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(
                                item.quantity * item.variant.precio_venta
                              )}
                            </TableCell>
                            <TableCell />
                          </TableRow>
                          <TableRow className="bg-muted/30">
                            <TableCell colSpan={6} className="py-2">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Cantidad
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      aria-label="Reducir"
                                      disabled={item.quantity <= 1}
                                      onClick={() =>
                                        updateQuantity(
                                          item.variant.id,
                                          item.quantity - 1
                                        )
                                      }
                                    >
                                      <Minus />
                                    </Button>
                                    <Input
                                      className="h-8 w-16 text-center"
                                      type="number"
                                      min="1"
                                      max={item.variant.stock_actual}
                                      value={item.quantity}
                                      onChange={(event) =>
                                        updateQuantity(
                                          item.variant.id,
                                          Number(event.target.value || 1)
                                        )
                                      }
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      aria-label="Aumentar"
                                      disabled={
                                        item.quantity >=
                                        item.variant.stock_actual
                                      }
                                      onClick={() =>
                                        updateQuantity(
                                          item.variant.id,
                                          item.quantity + 1
                                        )
                                      }
                                    >
                                      <Plus />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                  <span className="text-xs text-muted-foreground">
                                    Disponible: {item.variant.stock_actual}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      setCart((current) =>
                                        current.filter(
                                          (cartItem) =>
                                            cartItem.variant.id !==
                                            item.variant.id
                                        )
                                      )
                                    }
                                  >
                                    <Trash2 />
                                    Quitar
                                  </Button>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        </Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="rounded-md border py-8 text-center text-sm text-muted-foreground">
                  Carrito vacío.
                </div>
              )}

              <Button
                type="button"
                className="w-full"
                size="lg"
                disabled={cart.length === 0}
                onClick={() => setPaymentOpen(true)}
              >
                Pagar — {formatCurrency(total)}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={{ overscrollBehavior: "contain" }}
        >
          <DialogHeader>
            <DialogTitle>Cobro</DialogTitle>
          </DialogHeader>
          <PaymentForm total={total} cart={cart} onSuccess={handleSuccess} />
        </DialogContent>
      </Dialog>
    </section>
  )
}
