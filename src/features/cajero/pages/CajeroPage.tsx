import { Minus, Plus, ScanBarcode, ShoppingCart, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"

import { formatCurrency } from "@/features/admin/components/AdminTable"
import { useVariants } from "@/features/inventario/hooks/useProducts"
import type { Variant } from "@/features/inventario/types/product"
import {
  useCreateSale,
  useFindVariantByBarcode,
} from "@/features/cajero/hooks/usePos"
import type { PaymentMethod } from "@/features/cajero/services/posService"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

function playScanBeep() {
  const AudioContextCtor =
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: typeof window.AudioContext })
      .webkitAudioContext

  if (!AudioContextCtor) {
    return
  }

  const audioContext = new AudioContextCtor()
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()
  const now = audioContext.currentTime

  oscillator.type = "sine"
  oscillator.frequency.setValueAtTime(880, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.08, now + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)
  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.13)
  oscillator.onended = () => void audioContext.close()
}

export function CajeroPage() {
  const [barcode, setBarcode] = useState("")
  const [selectedVariantId, setSelectedVariantId] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO")
  const [amountReceived, setAmountReceived] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [error, setError] = useState("")
  const variantsQuery = useVariants({ page: 1, limit: 100 })
  const findByBarcode = useFindVariantByBarcode()
  const createSale = useCreateSale()
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
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.variant.id === variant.id)

      if (existing) {
        if (existing.quantity >= variant.stock_actual) {
          setError("No puedes vender mas que el stock actual.")
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

  async function handleBarcodeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = barcode.trim()

    if (!code) {
      return
    }

    try {
      const variant = await findByBarcode.mutateAsync(code)
      addVariant(variant)
      playScanBeep()
      setBarcode("")
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "No se encontro el codigo."
      )
    }
  }

  async function handleCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (cart.length === 0) {
      setError("Agrega al menos una prenda al carrito.")
      return
    }

    if (paymentMethod === "EFECTIVO" && received < total) {
      setError("El monto recibido no cubre el total.")
      return
    }

    try {
      const form = new FormData(event.currentTarget)
      await createSale.mutateAsync({
        nombre_cliente: String(form.get("nombre_cliente") || "Cliente final"),
        nit: String(form.get("nit") || "CF"),
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
      })
      setCart([])
      setAmountReceived("")
      setReferenceNumber("")
      event.currentTarget.reset()
    } catch (exception) {
      setError(
        exception instanceof Error
          ? exception.message
          : "No se pudo registrar la venta."
      )
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-heading">Venta de mostrador</h1>
          <p className="page-subtitle">
            Escanea, cobra y termina la venta sin salir de esta pantalla.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="size-4 text-primary" />
              Carrito
            </CardTitle>
            <CardDescription>
              Agrega prendas por codigo de barras o buscandolas por nombre.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(220px,320px)]">
              <form className="flex gap-2" onSubmit={handleBarcodeSubmit}>
                <Input
                  value={barcode}
                  onChange={(event) => setBarcode(event.target.value)}
                  placeholder="Escanear codigo de barras"
                  disabled={findByBarcode.isPending}
                />
                <Button
                  type="submit"
                  size="icon"
                  aria-label="Buscar codigo"
                  disabled={findByBarcode.isPending}
                >
                  <ScanBarcode />
                </Button>
              </form>
              <Select
                value={selectedVariantId}
                onValueChange={(value) => {
                  const variant = (variantsQuery.data?.data ?? []).find(
                    (item) => item.id === value
                  )
                  setSelectedVariantId("")
                  if (variant) {
                    addVariant(variant)
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Buscar prenda" />
                </SelectTrigger>
                <SelectContent>
                  {(variantsQuery.data?.data ?? []).map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      {variantLabel(variant)} -{" "}
                      {formatCurrency(variant.precio_venta)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prenda</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.variant.id}>
                    <TableCell>
                      <div className="font-medium">
                        {variantLabel(item.variant)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.variant.sku || item.variant.codigo_barras}
                      </div>
                    </TableCell>
                    <TableCell>{item.variant.stock_actual}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          aria-label="Reducir"
                          onClick={() =>
                            updateQuantity(item.variant.id, item.quantity - 1)
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
                          onClick={() =>
                            updateQuantity(item.variant.id, item.quantity + 1)
                          }
                        >
                          <Plus />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        item.quantity * item.variant.precio_venta
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar"
                        onClick={() =>
                          setCart((current) =>
                            current.filter(
                              (cartItem) =>
                                cartItem.variant.id !== item.variant.id
                            )
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {cart.length === 0 ? (
              <div className="rounded-md border py-8 text-center text-sm text-muted-foreground">
                Escanea o selecciona una prenda para iniciar la venta.
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-[4.5rem] xl:self-start">
          <CardHeader>
            <CardTitle>Cobro</CardTitle>
            <CardDescription>
              Confirma la forma de pago y finaliza la compra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleCheckout}>
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
                      <SelectValue />
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
                className="h-10 w-full"
                disabled={cart.length === 0 || createSale.isPending}
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
