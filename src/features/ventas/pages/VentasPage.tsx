import { useState } from "react"

import {
  AdminPager,
  formatCurrency,
  formatDate,
} from "@/features/admin/components/AdminTable"
import { useCancelSale, useSales } from "@/features/admin/hooks/useAdmin"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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

export function VentasPage() {
  const [page, setPage] = useState(1)
  const salesQuery = useSales({ page, limit: PAGE_SIZE })
  const cancelSale = useCancelSale()

  async function handleCancel(id: string) {
    const motivo = window.prompt("Motivo de anulacion")
    if (!motivo) return
    await cancelSale.mutateAsync({ id, motivo })
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Ventas</h1>
        <p className="page-subtitle">
          Revisa tickets emitidos, montos cobrados y anulaciones registradas.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historial de ventas</CardTitle>
          <CardDescription>
            Las ventas nuevas se registran desde el punto de venta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {salesQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando ventas...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(salesQuery.data?.data ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.fecha)}</TableCell>
                    <TableCell>{item.cliente || "Consumidor final"}</TableCell>
                    <TableCell>{item.usuario || "-"}</TableCell>
                    <TableCell>{item.items}</TableCell>
                    <TableCell>{formatCurrency(item.total)}</TableCell>
                    <TableCell>
                      <Badge variant={item.activo ? "secondary" : "outline"}>
                        {item.activo ? "Activa" : "Anulada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={!item.activo || cancelSale.isPending}
                        onClick={() => void handleCancel(item.id)}
                      >
                        Anular
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
    </section>
  )
}
