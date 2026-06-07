import {
  Minus,
  Plus,
  ScanBarcode,
  Search,
  ShoppingCart,
  Trash2,
} from "lucide-react"
import { Fragment, useMemo, useState } from "react"
import { toast } from "sonner"

import { formatCurrency } from "@/features/admin/utils/formatters"
import { useAllVariants } from "@/features/inventario/hooks/useProducts"
import type { Variant } from "@/features/inventario/types/product"
import {
  useCreateSale,
  useFindVariantByBarcode,
} from "@/features/cajero/hooks/usePos"
import type { PaymentMethod } from "@/features/cajero/services/posService"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
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

interface CartItem {
  variant: Variant
  quantity: number
}

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA_CREDITO", label: "Tarjeta credito" },
  { value: "TARJETA_DEBITO", label: "Tarjeta debito" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
]

function variantLabel(variant: Variant) {
  return [variant.producto_nombre, variant.talla_nombre, variant.color_nombre]
    .filter(Boolean)
    .join(" / ")
}

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
  const [barcode, setBarcode] = useState("")
  const [productSearch, setProductSearch] = useState("")
  const [sizeFilter, setSizeFilter] = useState("all")
  const [colorFilter, setColorFilter] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO")
  const [amountReceived, setAmountReceived] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [error, setError] = useState("")
  const variantsQuery = useAllVariants()
  const findByBarcode = useFindVariantByBarcode()
  const createSale = useCreateSale()
  const sellableVariants = useMemo(
    () =>
      (variantsQuery.data ?? []).filter(
        (variant) => variant.activo && variant.stock_actual > 0
      ),
    [variantsQuery.data]
  )
  const sizeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sellableVariants
            .map((variant) => variant.talla_nombre)
            .filter(Boolean)
        )
      ).sort(),
    [sellableVariants]
  )
  const colorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          sellableVariants
            .map((variant) => variant.color_nombre)
            .filter(Boolean)
        )
      ).sort(),
    [sellableVariants]
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
  const selectedPaymentMethod = PAYMENT_METHODS.find(
    (method) => method.value === paymentMethod
  )
  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.quantity * item.variant.precio_venta,
        0
      ),
    [cart]
  )
  const received = Number(amountReceived || 0)
  const change =
    paymentMethod === "EFECTIVO" ? Math.max(0, received - total) : 0

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
    setCart((current) =>
      current
        .map((item) => {
          if (item.variant.id !== variantId) {
            return item
          }

          return {
            ...item,
            quantity: Math.min(
              Math.max(1, quantity),
              item.variant.stock_actual
            ),
          }
        })
        .filter((item) => item.quantity > 0)
    )
  }

  function handleProductSelect(variant: Variant) {
    if (addVariant(variant)) {
      toast.success(`${variantLabel(variant)} agregado al carrito.`)
    }
  }

  async function handleBarcodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = barcode.trim()

    if (!code) {
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
    }
  }

  async function submitCheckout(form?: HTMLFormElement | null) {
    setError("")

    if (cart.length === 0) {
      setError("Agrega al menos una prenda al carrito.")
      toast.error("Agrega al menos una prenda al carrito.")
      return
    }

    const inactiveItem = cart.find(
      (item) => !item.variant.activo || item.variant.stock_actual <= 0
    )

    if (inactiveItem) {
      const message = `${variantLabel(inactiveItem.variant)} ya no esta disponible para vender.`
      setError(message)
      toast.error(message)
      return
    }

    if (paymentMethod === "EFECTIVO" && received < total) {
      setError("El monto recibido no cubre el total.")
      toast.error("El monto recibido no cubre el total.")
      return
    }

    try {
      const formData = form ? new FormData(form) : new FormData()
      const payload = {
        nombre_cliente: String(
          formData.get("nombre_cliente") || "Cliente final"
        ),
        nit: String(formData.get("nit") || "CF"),
        detalles: cart.map((item) => ({
          variante_id: item.variant.id,
          cantidad: item.quantity,
          precio_unitario: item.variant.precio_venta,
        })),
        pagos: [
          {
            metodo: paymentMethod,
            monto: total,
            monto_recibido: paymentMethod === "EFECTIVO" ? received : undefined,
            numero_referencia:
              paymentMethod === "EFECTIVO"
                ? undefined
                : referenceNumber || undefined,
          },
        ],
      }

      const promise = createSale.mutateAsync(payload)

      toast.promise(promise, {
        loading: "Registrando venta...",
        success: "Venta registrada correctamente.",
        error: (error) =>
          getErrorMessage(error, "No se pudo registrar la venta."),
      })

      await promise
      playSaleSuccess()
      setCart([])
      setAmountReceived("")
      setReferenceNumber("")
      form?.reset()
    } catch (exception) {
      const message = getErrorMessage(
        exception,
        "No se pudo registrar la venta."
      )
      setError(message)
    }
  }

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitCheckout(event.currentTarget)
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

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Productos disponibles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(220px,300px)_minmax(260px,1fr)_160px_160px]">
                <form
                  className="flex min-w-0 gap-2"
                  onSubmit={handleBarcodeSubmit}
                >
                  <Input
                    className="min-w-0"
                    value={barcode}
                    onChange={(event) => setBarcode(event.target.value)}
                    placeholder="Escanear código"
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
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Buscar prenda, SKU, color o código"
                    disabled={variantsQuery.isLoading}
                  />
                </div>
                <Select
                  value={sizeFilter}
                  onValueChange={(value) => setSizeFilter(value ?? "all")}
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
                  onValueChange={(value) => setColorFilter(value ?? "all")}
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
                Mostrando {filteredVariants.length} de {sellableVariants.length}{" "}
                productos disponibles.
              </div>

              {variantsQuery.isLoading ? (
                <div className="rounded-md border py-8 text-center text-sm text-muted-foreground">
                  Cargando productos...
                </div>
              ) : variantsQuery.isError ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-8 text-center text-sm text-destructive">
                  No se pudieron cargar los productos para vender.
                </div>
              ) : filteredVariants.length > 0 ? (
                <div className="max-h-[360px] overflow-auto rounded-md border">
                  <Table className="min-w-180">
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
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
                            <TableCell className="font-medium">
                              {variant.sku || variant.codigo_barras || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {variant.producto_nombre || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {variant.codigo_barras ||
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
                              <Badge variant={canAdd ? "secondary" : "outline"}>
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
              ) : (
                <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
                  No hay productos disponibles con esos filtros.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
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
                <div className="overflow-x-auto rounded-md border">
                  <Table className="min-w-180">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prenda</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cart.map((item) => (
                        <Fragment key={item.variant.id}>
                          <TableRow className="border-b-0">
                            <TableCell>
                              <div className="font-medium">
                                {variantLabel(item.variant)}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {item.variant.sku ||
                                item.variant.codigo_barras ||
                                "-"}
                            </TableCell>
                            <TableCell>
                              {formatCurrency(item.variant.precio_venta)}
                            </TableCell>
                            <TableCell>{item.variant.stock_actual}</TableCell>
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
                  Escanea o selecciona una prenda para iniciar la venta.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="xl:sticky xl:top-18 xl:self-start">
          <CardHeader>
            <CardTitle>Cobro</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" noValidate onSubmit={handleCheckout}>
              <div className="rounded-lg border bg-primary px-4 py-3 text-primary-foreground shadow-sm">
                <div className="text-sm opacity-85">Total a cobrar</div>
                <div className="text-3xl font-semibold tracking-normal">
                  {formatCurrency(total)}
                </div>
              </div>
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel htmlFor="nombre_cliente">Cliente</FieldLabel>
                  <Input
                    id="nombre_cliente"
                    name="nombre_cliente"
                    defaultValue="Cliente final"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="nit">NIT</FieldLabel>
                  <Input id="nit" name="nit" defaultValue="CF" />
                </Field>
                <Field>
                  <FieldLabel>Forma de pago</FieldLabel>
                  <Select
                    value={paymentMethod}
                    onValueChange={(value) =>
                      setPaymentMethod((value ?? "EFECTIVO") as PaymentMethod)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <span>{selectedPaymentMethod?.label ?? "Efectivo"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {paymentMethod === "EFECTIVO" ? (
                  <>
                    <Field>
                      <FieldLabel htmlFor="monto_recibido">
                        Monto recibido
                      </FieldLabel>
                      <Input
                        id="monto_recibido"
                        type="number"
                        min={total}
                        step="0.01"
                        value={amountReceived}
                        onChange={(event) =>
                          setAmountReceived(event.target.value)
                        }
                        required
                      />
                    </Field>
                    <div className="rounded-md bg-accent px-3 py-2 text-sm text-accent-foreground">
                      Vuelto: <strong>{formatCurrency(change)}</strong>
                    </div>
                  </>
                ) : (
                  <Field>
                    <FieldLabel htmlFor="numero_referencia">
                      Referencia
                    </FieldLabel>
                    <Input
                      id="numero_referencia"
                      value={referenceNumber}
                      onChange={(event) =>
                        setReferenceNumber(event.target.value)
                      }
                    />
                  </Field>
                )}
              </FieldGroup>
              <Button
                type="button"
                className="h-10 w-full"
                disabled={cart.length === 0 || createSale.isPending}
                onClick={(event) => {
                  void submitCheckout(event.currentTarget.form)
                }}
              >
                {createSale.isPending ? "Registrando..." : "Finalizar venta"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
