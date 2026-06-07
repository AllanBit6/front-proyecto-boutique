import { SlidersHorizontal } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { AdminPager } from "@/features/admin/components/AdminTable"
import { formatDate } from "@/features/admin/utils/formatters"
import {
  matchesDateRange,
  matchesTextSearch,
} from "@/features/admin/utils/tableFilters"
import {
  useCreateInventoryAdjustment,
  useInventoryMovements,
} from "@/features/admin/hooks/useAdmin"
import { useVariants } from "@/features/inventario/hooks/useProducts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { normalizeTextInput, positiveInteger } from "@/shared/utils/security"

const PAGE_SIZE = 10

const ADJUSTMENT_TYPES = [
  { value: "INGRESO", label: "Entrada" },
  { value: "SALIDA", label: "Salida" },
  { value: "AJUSTE", label: "Correccion" },
]

export function InventoryAdjustmentsPage() {
  const [page, setPage] = useState(1)
  const [movementType, setMovementType] = useState("all")
  const [movementSearch, setMovementSearch] = useState("")
  const [movementDateFrom, setMovementDateFrom] = useState("")
  const [movementDateTo, setMovementDateTo] = useState("")
  const [adjustmentType, setAdjustmentType] = useState("INGRESO")
  const [variantId, setVariantId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const movementsQuery = useInventoryMovements({
    page,
    limit: PAGE_SIZE,
    tipo: movementType,
  })
  const variantsQuery = useVariants({ page: 1, limit: 100 })
  const createAdjustment = useCreateInventoryAdjustment()
  const activeVariants = useMemo(
    () => (variantsQuery.data?.data ?? []).filter((variant) => variant.activo),
    [variantsQuery.data?.data]
  )
  const selectedVariant = activeVariants.find(
    (variant) => variant.id === variantId
  )
  const [lastResult, setLastResult] = useState<{
    type: "success" | "error" | "info"
    message: string
  } | null>(null)
  const selectedAdjustmentType = ADJUSTMENT_TYPES.find(
    (type) => type.value === adjustmentType
  )
  const hasActiveMovementFilters = Boolean(
    movementSearch.trim() || movementDateFrom || movementDateTo
  )
  const filteredMovements = useMemo(
    () =>
      (movementsQuery.data?.data ?? []).filter(
        (item) =>
          matchesTextSearch(movementSearch, [
            item.id,
            item.prenda,
            item.tipo,
            item.origen,
            item.motivo,
            item.cantidad,
            item.stockResultante,
            item.usuario,
          ]) && matchesDateRange(item.fecha, movementDateFrom, movementDateTo)
      ),
    [
      movementDateFrom,
      movementDateTo,
      movementSearch,
      movementsQuery.data?.data,
    ]
  )

  async function submitAdjustment(form?: HTMLFormElement | null) {
    const cantidad = positiveInteger(quantity)
    const motivo = normalizeTextInput(reason, { maxLength: 160 })

    if (!variantId || !selectedVariant) {
      setLastResult({
        type: "error",
        message: "Selecciona una prenda.",
      })
      toast.error("Selecciona una prenda para ajustar el stock.")
      return
    }

    if (!cantidad || cantidad <= 0) {
      setLastResult({
        type: "error",
        message: "La cantidad debe ser mayor a cero.",
      })
      toast.error("Ingresa una cantidad mayor a cero.")
      return
    }

    if (cantidad > 999999) {
      setLastResult({
        type: "error",
        message: "La cantidad es demasiado alta.",
      })
      toast.error("Revisa la cantidad.")
      return
    }

    if (!motivo) {
      setLastResult({
        type: "error",
        message: "El motivo es obligatorio para registrar el movimiento.",
      })
      toast.error("Ingresa el motivo del ajuste.")
      return
    }

    const payload = {
      variante_id: variantId,
      tipo: adjustmentType,
      cantidad,
      motivo,
    }
    const previousStock = selectedVariant.stock_actual
    const expectedStock =
      adjustmentType === "SALIDA"
        ? previousStock - cantidad
        : adjustmentType === "AJUSTE"
          ? cantidad
          : previousStock + cantidad

    setLastResult({
      type: "info",
      message: `Stock: ${previousStock} -> ${expectedStock}.`,
    })

    const promise = createAdjustment.mutateAsync({
      ...payload,
    })

    toast.promise(promise, {
      loading: "Aplicando ajuste de stock...",
      success: `Stock actualizado para ${selectedVariant.producto_nombre}.`,
      error: (error) => getErrorMessage(error),
    })

    try {
      await promise
      setLastResult({
        type: "success",
        message: "Ajuste registrado.",
      })
      setVariantId("")
      setQuantity("")
      setReason("")
      form?.reset()
    } catch (error) {
      setLastResult({
        type: "error",
        message: getErrorMessage(error),
      })
    }
  }

  async function handleAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await submitAdjustment(event.currentTarget)
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Ajustar stock</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              Corregir cantidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              noValidate
              onSubmit={handleAdjustment}
              onInvalid={(event) => {
                event.preventDefault()
                toast.error("Revisa los campos del ajuste de stock.")
              }}
            >
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel>Prenda</FieldLabel>
                  <Select
                    value={variantId}
                    onValueChange={(value) => setVariantId(value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <span
                        className={
                          !selectedVariant ? "text-muted-foreground" : ""
                        }
                      >
                        {selectedVariant
                          ? `${selectedVariant.producto_nombre} / ${selectedVariant.talla_nombre} / ${selectedVariant.color_nombre}`
                          : "Selecciona prenda"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {activeVariants.map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.producto_nombre} / {variant.talla_nombre} /{" "}
                          {variant.color_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedVariant ? (
                    <div className="text-xs text-muted-foreground">
                      Stock actual: {selectedVariant.stock_actual} unidades
                    </div>
                  ) : null}
                  {!variantsQuery.isLoading && !activeVariants.length ? (
                    <div className="text-xs text-destructive">
                      No hay prendas activas disponibles para ajustar.
                    </div>
                  ) : null}
                  {variantsQuery.isError ? (
                    <div className="text-xs text-destructive">
                      {getErrorMessage(variantsQuery.error)}
                    </div>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel>Que cambio haras</FieldLabel>
                  <Select
                    value={adjustmentType}
                    onValueChange={(value) =>
                      setAdjustmentType(value ?? "INGRESO")
                    }
                  >
                    <SelectTrigger className="w-full">
                      <span>{selectedAdjustmentType?.label ?? "Entrada"}</span>
                    </SelectTrigger>
                    <SelectContent>
                      {ADJUSTMENT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cantidad">Cantidad</FieldLabel>
                  <Input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    max="999999"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="motivo">Motivo</FieldLabel>
                  <Input
                    id="motivo"
                    name="motivo"
                    placeholder="Conteo fisico, merma, correccion..."
                    value={reason}
                    onChange={(event) =>
                      setReason(
                        normalizeTextInput(event.target.value, {
                          maxLength: 160,
                        })
                      )
                    }
                    maxLength={160}
                  />
                </Field>
              </FieldGroup>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  createAdjustment.isPending ||
                  !variantId ||
                  variantsQuery.isLoading
                }
              >
                {createAdjustment.isPending ? "Aplicando..." : "Aplicar ajuste"}
              </Button>
              {lastResult ? (
                <div
                  className={
                    lastResult.type === "error"
                      ? "rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                      : lastResult.type === "success"
                        ? "rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
                        : "rounded-md border bg-muted px-3 py-2 text-sm text-muted-foreground"
                  }
                >
                  {lastResult.message}
                </div>
              ) : null}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Cambios de stock</CardTitle>
            </div>
            <Select
              value={movementType}
              onValueChange={(value) => {
                setMovementType(value ?? "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-44">
                <span>
                  {movementType === "all"
                    ? "Todos"
                    : ADJUSTMENT_TYPES.find(
                        (type) => type.value === movementType
                      )?.label}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="INGRESO">Entradas</SelectItem>
                <SelectItem value="SALIDA">Salidas</SelectItem>
                <SelectItem value="AJUSTE">Ajustes</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_160px]">
              <Input
                value={movementSearch}
                onChange={(event) => {
                  setMovementSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar ID, prenda, motivo u origen"
              />
              <Input
                type="date"
                value={movementDateFrom}
                onChange={(event) => {
                  setMovementDateFrom(event.target.value)
                  setPage(1)
                }}
              />
              <Input
                type="date"
                value={movementDateTo}
                onChange={(event) => {
                  setMovementDateTo(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            {hasActiveMovementFilters ? (
              <div className="text-xs text-muted-foreground">
                {filteredMovements.length} resultados
              </div>
            ) : null}
            {movementsQuery.isLoading ? (
              <TableSkeleton columns={6} />
            ) : movementsQuery.isError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {getErrorMessage(movementsQuery.error)}
              </div>
            ) : (
              <LoadTransition>
                <div className="rounded-md border">
                  <Table className="min-w-[560px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Prenda</TableHead>
                        <TableHead>Cambio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="hidden sm:table-cell">
                          Stock
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                          Motivo
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{formatDate(item.fecha)}</TableCell>
                          <TableCell className="max-w-44 whitespace-normal">
                            <div>{item.prenda || "-"}</div>
                            <div className="text-xs text-muted-foreground md:hidden">
                              {item.motivo || item.origen}
                            </div>
                            <div className="text-xs text-muted-foreground sm:hidden">
                              Stock: {item.stockResultante}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{item.tipo}</Badge>
                          </TableCell>
                          <TableCell>{item.cantidad}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {item.stockResultante}
                          </TableCell>
                          <TableCell className="hidden max-w-48 whitespace-normal md:table-cell">
                            {item.motivo || item.origen}
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredMovements.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            Sin resultados.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                </div>
              </LoadTransition>
            )}
            {movementsQuery.data ? (
              <AdminPager
                page={movementsQuery.data.page}
                totalPages={movementsQuery.data.totalPages}
                total={movementsQuery.data.total}
                disabled={movementsQuery.isFetching}
                onPrevious={() => setPage((value) => value - 1)}
                onNext={() => setPage((value) => value + 1)}
              />
            ) : null}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "No se pudo aplicar el ajuste de stock."
}
