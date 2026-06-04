import { useMemo, useState } from "react"

import {
  AdminPager,
  formatCurrency,
  formatDate,
} from "@/features/admin/components/AdminTable"
import {
  matchesDateRange,
  matchesTextSearch,
} from "@/features/admin/utils/tableFilters"
import type { Payment } from "@/features/admin/services/adminService"
import { usePayments } from "@/features/admin/hooks/useAdmin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

const PAGE_SIZE = 10

export function ReporteriaPage() {
  const [paymentPage, setPaymentPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState<Payment>()
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [methodFilter, setMethodFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const paymentsQuery = usePayments({ page: paymentPage, limit: PAGE_SIZE })
  const filteredPayments = useMemo(
    () =>
      (paymentsQuery.data?.data ?? []).filter(
        (item) =>
          matchesTextSearch(search, [
            item.id,
            item.ventaId,
            item.cliente,
            item.nit,
            item.metodo,
            item.estado,
            item.numeroReferencia,
            item.usuario,
          ]) &&
          matchesDateRange(item.fecha, dateFrom, dateTo) &&
          (methodFilter === "all" || item.metodo === methodFilter) &&
          (statusFilter === "all" || item.estado === statusFilter)
      ),
    [
      dateFrom,
      dateTo,
      methodFilter,
      paymentsQuery.data?.data,
      search,
      statusFilter,
    ]
  )
  const paymentMethods = useMemo(
    () =>
      Array.from(
        new Set((paymentsQuery.data?.data ?? []).map((item) => item.metodo))
      ).filter(Boolean),
    [paymentsQuery.data?.data]
  )
  const paymentStatuses = useMemo(
    () =>
      Array.from(
        new Set((paymentsQuery.data?.data ?? []).map((item) => item.estado))
      ).filter(Boolean),
    [paymentsQuery.data?.data]
  )

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Cobros</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Cobros registrados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_150px_150px_170px_150px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar ID, venta, cliente o referencia"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={methodFilter}
              onChange={(event) => setMethodFilter(event.target.value)}
            >
              <option value="all">Todo metodo</option>
              {paymentMethods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">Todo estado</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          {paymentsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando pagos...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Forma de pago</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.fecha)}</TableCell>
                    <TableCell>{item.metodo}</TableCell>
                    <TableCell>{item.cliente || "-"}</TableCell>
                    <TableCell>{formatCurrency(item.monto)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.estado}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPayment(item)}
                      >
                        Detalle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredPayments.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      No hay cobros con esos filtros.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
          {paymentsQuery.data ? (
            <AdminPager
              page={paymentsQuery.data.page}
              totalPages={paymentsQuery.data.totalPages}
              total={paymentsQuery.data.total}
              disabled={paymentsQuery.isFetching}
              onPrevious={() => setPaymentPage((value) => value - 1)}
              onNext={() => setPaymentPage((value) => value + 1)}
            />
          ) : null}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(selectedPayment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPayment(undefined)
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle de cobro</DialogTitle>
          </DialogHeader>
          {selectedPayment ? (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
                <DetailItem
                  label="Fecha"
                  value={formatDate(selectedPayment.fecha)}
                />
                <DetailItem
                  label="Forma de pago"
                  value={selectedPayment.metodo}
                />
                <DetailItem
                  label="Cliente"
                  value={selectedPayment.cliente || "Consumidor final"}
                />
                <DetailItem label="NIT" value={selectedPayment.nit || "CF"} />
                <DetailItem
                  label="Venta"
                  value={selectedPayment.ventaId || "-"}
                />
                <DetailItem
                  label="Vendedor"
                  value={selectedPayment.usuario || "-"}
                />
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md bg-muted px-3 py-2">
                  <div className="text-xs text-muted-foreground">Monto</div>
                  <div className="text-lg font-semibold">
                    {formatCurrency(selectedPayment.monto)}
                  </div>
                </div>
                <div className="rounded-md bg-muted px-3 py-2">
                  <div className="text-xs text-muted-foreground">Estado</div>
                  <Badge variant="secondary">{selectedPayment.estado}</Badge>
                </div>
              </div>

              {selectedPayment.metodo === "EFECTIVO" ? (
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <DetailBox
                    label="Monto recibido"
                    value={
                      selectedPayment.montoRecibido === undefined
                        ? "-"
                        : formatCurrency(selectedPayment.montoRecibido)
                    }
                  />
                  <DetailBox
                    label="Vuelto"
                    value={
                      selectedPayment.cambio === undefined
                        ? "-"
                        : formatCurrency(selectedPayment.cambio)
                    }
                  />
                </div>
              ) : (
                <DetailBox
                  label="Numero de referencia"
                  value={selectedPayment.numeroReferencia || "-"}
                />
              )}
            </div>
          ) : null}
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

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}
