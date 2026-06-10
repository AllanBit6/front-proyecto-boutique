import { useMemo, useState } from "react"
import { toast } from "sonner"

import { AdminPager } from "@/features/admin/components/AdminTable"
import { formatCurrency, formatDate } from "@/features/admin/utils/formatters"
import {
  matchesDateRange,
  matchesTextSearch,
} from "@/features/admin/utils/tableFilters"
import {
  useCancelSale,
  useSaleDetail,
  useSales,
} from "@/features/admin/hooks/useAdmin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DetailSkeleton,
  LoadTransition,
  TableSkeleton,
} from "@/components/ui/loading-skeletons"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { normalizeTextInput } from "@/shared/utils/security"

const PAGE_SIZE = 10

export function VentasPage() {
  const [page, setPage] = useState(1)
  const [selectedSaleId, setSelectedSaleId] = useState<string>()
  const [saleToCancel, setSaleToCancel] = useState<string>()
  const [cancelReason, setCancelReason] = useState("")
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const salesQuery = useSales({ page, limit: PAGE_SIZE })
  const saleDetailQuery = useSaleDetail(selectedSaleId)
  const cancelSale = useCancelSale()
  const hasActiveFilters = Boolean(
    search.trim() || dateFrom || dateTo || statusFilter !== "all"
  )
  const filteredSales = useMemo(
    () =>
      (salesQuery.data?.data ?? []).filter(
        (item) =>
          matchesTextSearch(search, [
            item.id,
            item.cliente,
            item.nit,
            item.usuario,
            item.total,
          ]) &&
          matchesDateRange(item.fecha, dateFrom, dateTo) &&
          (statusFilter === "all" ||
            (statusFilter === "active" ? item.activo : !item.activo))
      ),
    [dateFrom, dateTo, salesQuery.data?.data, search, statusFilter]
  )

  async function handleCancelSale(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault()
    const motivo = normalizeTextInput(cancelReason, { maxLength: 160 })

    if (!saleToCancel || !motivo) {
      toast.error("Ingresa el motivo de anulación.")
      return
    }

    const promise = cancelSale.mutateAsync({ id: saleToCancel, motivo })

    toast.promise(promise, {
      loading: "Anulando venta...",
      success: "Venta anulada correctamente.",
      error: (error) =>
        error instanceof Error ? error.message : "No se pudo anular la venta.",
    })

    try {
      await promise
      setSaleToCancel(undefined)
      setCancelReason("")
    } catch {
      // toast.promise displays the error.
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Ventas</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Ventas registradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_160px_150px]">
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Buscar ID, cliente, NIT o vendedor"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPage(1)
              }}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPage(1)
              }}
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value ?? "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <span>
                  {statusFilter === "active"
                    ? "Vigentes"
                    : statusFilter === "cancelled"
                      ? "Anuladas"
                      : "Todo estado"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo estado</SelectItem>
                <SelectItem value="active">Vigentes</SelectItem>
                <SelectItem value="cancelled">Anuladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters ? (
            <div className="text-xs text-muted-foreground">
              {filteredSales.length} resultados
            </div>
          ) : null}
          {salesQuery.isLoading ? (
            <TableSkeleton columns={7} />
          ) : salesQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(
                salesQuery.error,
                "No se pudieron cargar las ventas."
              )}
            </div>
          ) : (
            <LoadTransition>
              <div className="rounded-md border">
                <Table className="min-w-[560px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Vendedor
                      </TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Prendas
                      </TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.fecha)}</TableCell>
                        <TableCell className="max-w-44 whitespace-normal">
                          <div className="font-medium">
                            {item.cliente || "Consumidor final"}
                          </div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {item.usuario || "Sin vendedor"}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            {item.items} prendas
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.usuario || "-"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {item.items}
                        </TableCell>
                        <TableCell>{formatCurrency(item.total)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={item.activo ? "secondary" : "outline"}
                          >
                            {item.activo ? "Vigente" : "Anulada"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-1 sm:flex-row sm:justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedSaleId(item.id)}
                            >
                              Detalle
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!item.activo || cancelSale.isPending}
                              onClick={() => {
                                setSaleToCancel(item.id)
                                setCancelReason("")
                              }}
                            >
                              Anular
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!filteredSales.length ? (
                      <TableRow>
                        <TableCell
                          colSpan={7}
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
          {salesQuery.data ? (
            <AdminPager
              page={salesQuery.data.page}
              totalPages={salesQuery.data.totalPages}
              total={salesQuery.data.total}
              disabled={salesQuery.isFetching}
              onPrevious={() => setPage((value) => value - 1)}
              onNext={() => setPage((value) => value + 1)}
            />
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedSaleId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedSaleId(undefined)
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalle de venta</DialogTitle>
          </DialogHeader>
          {saleDetailQuery.isLoading ? (
            <DetailSkeleton items={4} />
          ) : saleDetailQuery.data ? (
            <LoadTransition>
              <div className="space-y-4">
                <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <DetailItem
                    label="Fecha"
                    value={formatDate(saleDetailQuery.data.fecha)}
                  />
                  <DetailItem
                    label="Cliente"
                    value={saleDetailQuery.data.cliente || "Consumidor final"}
                  />
                  <DetailItem
                    label="NIT"
                    value={saleDetailQuery.data.nit || "CF"}
                  />
                  <DetailItem
                    label="Vendedor"
                    value={saleDetailQuery.data.usuario || "-"}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Productos</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prenda</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleDetailQuery.data.detalles.length > 0 ? (
                        saleDetailQuery.data.detalles.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">
                                {item.prenda || "-"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.marca_nombre || ""}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.sku || item.codigoBarras || "Sin código"}
                              </div>
                            </TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>
                              {formatCurrency(item.precioUnitario)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            Sin productos en el detalle.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Cobros</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Metodo</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Recibido</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleDetailQuery.data.pagos.length > 0 ? (
                        saleDetailQuery.data.pagos.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.metodo}</TableCell>
                            <TableCell>
                              {item.numeroReferencia || "-"}
                            </TableCell>
                            <TableCell>
                              {item.montoRecibido === undefined
                                ? "-"
                                : formatCurrency(item.montoRecibido)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.monto)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center text-muted-foreground"
                          >
                            Sin cobros en el detalle.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex justify-end rounded-md bg-muted px-3 py-2 text-sm font-medium">
                  Total: {formatCurrency(saleDetailQuery.data.total)}
                </div>
              </div>
            </LoadTransition>
          ) : (
            <div className="text-sm text-muted-foreground">
              No se pudo cargar el detalle.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(saleToCancel)}
        onOpenChange={(open) => {
          if (!open) {
            setSaleToCancel(undefined)
            setCancelReason("")
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Anular venta</DialogTitle>
          </DialogHeader>
          <form className="space-y-3" onSubmit={handleCancelSale}>
            <Textarea
              value={cancelReason}
              onChange={(event) =>
                setCancelReason(
                  normalizeTextInput(event.target.value, { maxLength: 160 })
                )
              }
              placeholder="Motivo de anulación"
              maxLength={160}
              rows={4}
            />
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSaleToCancel(undefined)
                  setCancelReason("")
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={!cancelReason.trim() || cancelSale.isPending}
              >
                {cancelSale.isPending ? "Anulando..." : "Anular"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
