import { useState } from "react"

import {
  AdminPager,
  formatCurrency,
  formatDate,
} from "@/features/admin/components/AdminTable"
import { usePayments } from "@/features/admin/hooks/useAdmin"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  const paymentsQuery = usePayments({ page: paymentPage, limit: PAGE_SIZE })

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Pagos</h1>
        <p className="page-subtitle">
          Consulta los cobros generados por ventas y su estado registrado.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Registro de pagos</CardTitle>
          <CardDescription>
            Cobros asociados a ventas emitidas desde el punto de venta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentsQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando pagos...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(paymentsQuery.data?.data ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.fecha)}</TableCell>
                    <TableCell>{item.metodo}</TableCell>
                    <TableCell>{item.cliente || "-"}</TableCell>
                    <TableCell>{formatCurrency(item.monto)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.estado}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
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
    </section>
  )
}
