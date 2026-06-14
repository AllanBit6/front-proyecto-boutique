import { useMemo, useState } from "react"

import { AdminPager } from "@/features/admin/components/AdminTable"
import { formatCurrency, formatDate } from "@/features/admin/utils/formatters"
import {
  matchesDateRange,
  matchesTextSearch,
} from "@/features/admin/utils/tableFilters"
import type { Payment } from "@/features/admin/services/adminService"
import { usePaymentDetail, usePayments } from "@/features/admin/hooks/useAdmin"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DetailSkeleton,
  LoadTransition,
  TableSkeleton,
} from "@/components/ui/loading-skeletons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
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
  const paymentDetailQuery = usePaymentDetail(selectedPayment?.id)
  const paymentDetail = paymentDetailQuery.data ?? selectedPayment
  const hasActiveFilters = Boolean(
    search.trim() ||
    dateFrom ||
    dateTo ||
    methodFilter !== "all" ||
    statusFilter !== "all"
  )
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
              onChange={(event) => {
                setSearch(event.target.value)
                setPaymentPage(1)
              }}
              placeholder="Buscar ID, venta, cliente o referencia"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPaymentPage(1)
              }}
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPaymentPage(1)
              }}
            />
            <Select
              value={methodFilter}
              onValueChange={(value) => {
                setMethodFilter(value ?? "all")
                setPaymentPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <span>
                  {methodFilter === "all" ? "Todo método" : methodFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo método</SelectItem>
                {paymentMethods.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value ?? "all")
                setPaymentPage(1)
              }}
            >
              <SelectTrigger className="w-full">
                <span>
                  {statusFilter === "all" ? "Todo estado" : statusFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo estado</SelectItem>
                {paymentStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters ? (
            <div className="text-xs text-muted-foreground">
              {filteredPayments.length} resultados
            </div>
          ) : null}
          {paymentsQuery.isLoading ? (
            <TableSkeleton columns={6} />
          ) : paymentsQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(
                paymentsQuery.error,
                "No se pudieron cargar los cobros."
              )}
            </div>
          ) : (
            <LoadTransition>
              <div className="rounded-md border">
                <Table className="min-w-[540px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Forma de pago
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Estado
                      </TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.fecha)}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.metodo}
                        </TableCell>
                        <TableCell className="max-w-44 whitespace-normal">
                          <div>{item.cliente || "-"}</div>
                          <div className="text-xs text-muted-foreground md:hidden">
                            {item.metodo}
                          </div>
                          <div className="mt-1 sm:hidden">
                            <PaymentStatusBadge estado={item.estado} />
                          </div>
                        </TableCell>
                        <TableCell>{formatOptionalCurrency(item.monto)}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <PaymentStatusBadge estado={item.estado} />
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
                          Sin resultados.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            </LoadTransition>
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
          {paymentDetailQuery.isLoading && !paymentDetail ? (
            <DetailSkeleton items={3} />
          ) : paymentDetail ? (
            <div className="space-y-4">
              {paymentDetailQuery.isFetching ? (
                <div className="text-xs text-muted-foreground">
                  Actualizando detalle...
                </div>
              ) : null}
              <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2">
                <DetailItem
                  label="Fecha"
                  value={formatDate(paymentDetail.fecha)}
                />
                <DetailItem
                  label="Forma de pago"
                  value={paymentDetail.metodo || "-"}
                />
                <DetailItem
                  label="Cliente"
                  value={paymentDetail.cliente || "-"}
                />
                <DetailItem label="NIT" value={paymentDetail.nit || "-"} />
                <DetailItem
                  label="Venta"
                  value={paymentDetail.ventaId || "-"}
                />
                <DetailItem
                  label="Vendedor"
                  value={paymentDetail.usuario || "-"}
                />
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md bg-muted px-3 py-2">
                  <div className="text-xs text-muted-foreground">Monto</div>
                  <div className="text-lg font-semibold">
                    {formatOptionalCurrency(paymentDetail.monto)}
                  </div>
                </div>
                <div className="rounded-md bg-muted px-3 py-2">
                  <div className="text-xs text-muted-foreground">Estado</div>
                  <PaymentStatusBadge estado={paymentDetail.estado} />
                </div>
              </div>

              {paymentDetail.metodo === "EFECTIVO" ? (
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  <DetailBox
                    label="Monto recibido"
                    value={
                      paymentDetail.montoRecibido === undefined
                        ? "-"
                        : formatCurrency(paymentDetail.montoRecibido)
                    }
                  />
                  <DetailBox
                    label="Vuelto"
                    value={
                      paymentDetail.cambio === undefined
                        ? "-"
                        : formatCurrency(paymentDetail.cambio)
                    }
                  />
                </div>
              ) : (
                <DetailBox
                  label="Número de referencia"
                  value={paymentDetail.numeroReferencia || "-"}
                />
              )}
            </div>
          ) : paymentDetailQuery.isError ? (
            <div className="text-sm text-destructive">
              {getErrorMessage(
                paymentDetailQuery.error,
                "No se pudo cargar el detalle de cobro."
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
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

function formatOptionalCurrency(value?: number) {
  return value === undefined || Number.isNaN(value) ? "-" : formatCurrency(value)
}

function PaymentStatusBadge({ estado }: { estado?: string }) {
  return <Badge variant="secondary">{estado || "Sin estado"}</Badge>
}
