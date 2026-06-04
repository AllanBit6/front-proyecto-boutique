import { useMemo, useState } from "react"
import { toast } from "sonner"

import {
  AdminPager,
  formatCurrency,
  formatDate,
} from "@/features/admin/components/AdminTable"
import {
  matchesDateRange,
  matchesTextSearch,
} from "@/features/admin/utils/tableFilters"
import {
  useCancelPurchase,
  useCreatePurchase,
  usePurchases,
} from "@/features/admin/hooks/useAdmin"
import { useVariants } from "@/features/inventario/hooks/useProducts"
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
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAGE_SIZE = 10

export function ComprasPage() {
  const [page, setPage] = useState(1)
  const [variantId, setVariantId] = useState("")
  const [purchaseSearch, setPurchaseSearch] = useState("")
  const [purchaseDateFrom, setPurchaseDateFrom] = useState("")
  const [purchaseDateTo, setPurchaseDateTo] = useState("")
  const [purchaseStatus, setPurchaseStatus] = useState("all")
  const purchasesQuery = usePurchases({ page, limit: PAGE_SIZE })
  const variantsQuery = useVariants({ page: 1, limit: 100 })
  const createPurchase = useCreatePurchase()
  const cancelPurchase = useCancelPurchase()
  const activeVariants = useMemo(
    () => (variantsQuery.data?.data ?? []).filter((variant) => variant.activo),
    [variantsQuery.data?.data]
  )
  const selectedVariant = activeVariants.find(
    (variant) => variant.id === variantId
  )
  const filteredPurchases = useMemo(
    () =>
      (purchasesQuery.data?.data ?? []).filter(
        (item) =>
          matchesTextSearch(purchaseSearch, [
            item.id,
            item.usuario,
            item.items,
            item.total,
          ]) &&
          matchesDateRange(item.fecha, purchaseDateFrom, purchaseDateTo) &&
          (purchaseStatus === "all" ||
            (purchaseStatus === "active" ? item.activo : !item.activo))
      ),
    [
      purchaseDateFrom,
      purchaseDateTo,
      purchaseSearch,
      purchaseStatus,
      purchasesQuery.data?.data,
    ]
  )

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const cantidad = Number(form.get("cantidad") ?? 0)
    const precioUnitario = Number(form.get("precio_unitario") ?? 0)

    if (!variantId || !selectedVariant) {
      toast.error("Selecciona una prenda para sumar stock.")
      return
    }

    if (!cantidad || cantidad <= 0) {
      toast.error("Ingresa una cantidad mayor a cero.")
      return
    }

    if (precioUnitario < 0) {
      toast.error("Ingresa un costo valido.")
      return
    }

    const promise = createPurchase.mutateAsync({
      variante_id: variantId,
      cantidad,
      precio_unitario: precioUnitario,
    })

    toast.promise(promise, {
      loading: "Registrando entrada de stock...",
      success: `Stock sumado para ${selectedVariant.producto_nombre}.`,
      error: (error) => getErrorMessage(error),
    })

    await promise
    setVariantId("")
    event.currentTarget.reset()
  }

  async function handleCancel(id: string) {
    const motivo = window.prompt("Motivo de anulacion")
    if (!motivo) return
    const promise = cancelPurchase.mutateAsync({ id, motivo })

    toast.promise(promise, {
      loading: "Anulando compra...",
      success: "Compra anulada correctamente.",
      error: (error) => getErrorMessage(error),
    })

    await promise
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Compras</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Producto recibido</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleCreate}>
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel>Prenda</FieldLabel>
                  <Select
                    value={variantId}
                    onValueChange={(value) => setVariantId(value ?? "")}
                  >
                    <SelectTrigger>
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
                  {!variantsQuery.isLoading && !activeVariants.length ? (
                    <div className="text-xs text-destructive">
                      No hay prendas activas disponibles para recibir stock.
                    </div>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="cantidad">Cantidad</FieldLabel>
                  <Input
                    id="cantidad"
                    name="cantidad"
                    type="number"
                    min="1"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="precio_unitario">
                    Costo por unidad
                  </FieldLabel>
                  <Input
                    id="precio_unitario"
                    name="precio_unitario"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                  />
                </Field>
              </FieldGroup>
              <Button
                disabled={
                  createPurchase.isPending ||
                  !variantId ||
                  variantsQuery.isLoading
                }
              >
                {createPurchase.isPending ? "Guardando..." : "Sumar al stock"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entradas registradas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_160px_150px]">
              <Input
                value={purchaseSearch}
                onChange={(event) => setPurchaseSearch(event.target.value)}
                placeholder="Buscar ID, usuario o total"
              />
              <Input
                type="date"
                value={purchaseDateFrom}
                onChange={(event) => setPurchaseDateFrom(event.target.value)}
              />
              <Input
                type="date"
                value={purchaseDateTo}
                onChange={(event) => setPurchaseDateTo(event.target.value)}
              />
              <select
                className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
                value={purchaseStatus}
                onChange={(event) => setPurchaseStatus(event.target.value)}
              >
                <option value="all">Todo estado</option>
                <option value="active">Vigentes</option>
                <option value="cancelled">Anuladas</option>
              </select>
            </div>
            {purchasesQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">
                Cargando compras...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Registrado por</TableHead>
                    <TableHead>Prendas</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.fecha)}</TableCell>
                      <TableCell>{item.usuario || "-"}</TableCell>
                      <TableCell>{item.items}</TableCell>
                      <TableCell>{formatCurrency(item.total)}</TableCell>
                      <TableCell>
                        <Badge variant={item.activo ? "secondary" : "outline"}>
                          {item.activo ? "Vigente" : "Anulada"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!item.activo || cancelPurchase.isPending}
                          onClick={() => void handleCancel(item.id)}
                        >
                          Anular
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredPurchases.length ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        No hay compras con esos filtros.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            )}
            {purchasesQuery.data ? (
              <AdminPager
                page={purchasesQuery.data.page}
                totalPages={purchasesQuery.data.totalPages}
                total={purchasesQuery.data.total}
                disabled={purchasesQuery.isFetching}
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

  return "No se pudo completar la operacion."
}
