import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  useActiveCashRegister,
  useCashRegisters,
} from "@/features/admin/hooks/useAdmin"
import { formatCurrency } from "@/features/admin/utils/formatters"
import { useCreateSale } from "@/features/cajero/hooks/usePos"
import type { PaymentMethod } from "@/features/cajero/services/posService"
import type { CartItem } from "@/features/cajero/types/posTypes"
import { getErrorMessage, variantLabel } from "@/features/cajero/helpers/posHelpers"
import {
  moneyValue,
  normalizeCodeInput,
  normalizeTextInput,
} from "@/shared/utils/security"
import { useAuthStore } from "@/store"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"

const PAYMENT_METHODS: Array<{ value: PaymentMethod; label: string }> = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA_CREDITO", label: "Tarjeta crédito" },
  { value: "TARJETA_DEBITO", label: "Tarjeta débito" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
]

interface PaymentFormProps {
  total: number
  cart: CartItem[]
  onSuccess: () => void
}

export function PaymentForm({ total, cart, onSuccess }: PaymentFormProps) {
  const user = useAuthStore((state) => state.user)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO")
  const [amountReceived, setAmountReceived] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [error, setError] = useState("")

  const createSale = useCreateSale()
  const activeCashQuery = useActiveCashRegister()
  const cashRegistersQuery = useCashRegisters({ page: 1, limit: 100 })

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

  const selectedPaymentMethod = PAYMENT_METHODS.find(
    (method) => method.value === paymentMethod
  )

  const received = moneyValue(amountReceived)
  const change =
    paymentMethod === "EFECTIVO" ? Math.max(0, received - total) : 0

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")

    if (isCheckingCash) {
      setError("Espera mientras se valida la caja activa.")
      toast.error("Espera mientras se valida la caja activa.")
      return
    }

    if (!canSell) {
      setError("Debes abrir caja antes de registrar una venta.")
      toast.error("Debes abrir caja antes de registrar una venta.")
      return
    }

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
      const formData = new FormData(event.currentTarget)
      const customerName =
        normalizeTextInput(formData.get("nombre_cliente"), {
          maxLength: 80,
        }) || "Cliente final"
      const customerNit = normalizeCodeInput(formData.get("nit"), 20) || "CF"
      const reference = normalizeCodeInput(referenceNumber, 60)

      const payload = {
        nombre_cliente: customerName,
        nit: customerNit,
        detalles: cart.map((item) => ({
          variante_id: item.variant.id,
          cantidad: item.quantity,
          precio_unitario: item.variant.precio_venta,
        })),
        pagos: [
          {
            metodo: paymentMethod,
            monto: total,
            monto_recibido:
              paymentMethod === "EFECTIVO" ? received : undefined,
            numero_referencia:
              paymentMethod === "EFECTIVO" ? undefined : reference || undefined,
          },
        ],
      }

      const promise = createSale.mutateAsync(payload)

      toast.promise(promise, {
        loading: "Registrando venta...",
        success: "Venta registrada correctamente.",
        error: (err) =>
          getErrorMessage(err, "No se pudo registrar la venta."),
      })

      await promise
      onSuccess()
    } catch (exception) {
      setError(getErrorMessage(exception, "No se pudo registrar la venta."))
    }
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit}>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

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
            maxLength={80}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="nit">NIT</FieldLabel>
          <Input id="nit" name="nit" defaultValue="CF" maxLength={20} />
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
                max="999999.99"
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
                setReferenceNumber(
                  normalizeCodeInput(event.target.value, 60)
                )
              }
              maxLength={60}
            />
          </Field>
        )}
      </FieldGroup>

      <Button
        type="submit"
        className="h-10 w-full"
        disabled={
          cart.length === 0 ||
          createSale.isPending ||
          isCheckingCash ||
          !canSell
        }
      >
        {createSale.isPending
          ? "Registrando..."
          : isCheckingCash
            ? "Validando caja..."
            : "Finalizar venta"}
      </Button>
    </form>
  )
}
