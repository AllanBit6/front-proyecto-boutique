import { useState } from "react"

import { AdminPager, formatCurrency, formatDate } from "@/features/admin/components/AdminTable"
import {
  useActiveCashRegister,
  useCashRegisters,
  useCloseCashRegister,
  useOpenCashRegister,
} from "@/features/admin/hooks/useAdmin"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const PAGE_SIZE = 10

export function CajaPage() {
  const [page, setPage] = useState(1)
  const activeCashQuery = useActiveCashRegister()
  const cashQuery = useCashRegisters({ page, limit: PAGE_SIZE })
  const openCash = useOpenCashRegister()
  const closeCash = useCloseCashRegister()
  const activeCash = activeCashQuery.data

  async function handleOpen(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await openCash.mutateAsync({
      saldo_inicial: Number(form.get("saldo_inicial") ?? 0),
      observaciones: String(form.get("observaciones") ?? ""),
    })
    event.currentTarget.reset()
  }

  async function handleClose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCash) return
    const form = new FormData(event.currentTarget)
    await closeCash.mutateAsync({
      id: activeCash.id,
      saldo_final: Number(form.get("saldo_final") ?? 0),
      observaciones: String(form.get("observaciones") ?? ""),
    })
    event.currentTarget.reset()
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Caja</h1>
        <p className="text-sm text-muted-foreground">Apertura, cierre e historial de cajas.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{activeCash ? "Caja activa" : "Abrir caja"}</CardTitle>
            <CardDescription>
              {activeCash ? `Abierta: ${formatDate(activeCash.fechaApertura)}` : "Registra el saldo inicial."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activeCash ? (
              <form className="space-y-3" onSubmit={handleClose}>
                <div className="rounded-lg border p-3 text-sm">
                  Saldo inicial: <strong>{formatCurrency(activeCash.saldoInicial)}</strong>
                </div>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor="saldo_final">Saldo final</FieldLabel>
                    <Input id="saldo_final" name="saldo_final" type="number" step="0.01" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="observaciones_cierre">Observaciones</FieldLabel>
                    <Input id="observaciones_cierre" name="observaciones" />
                  </Field>
                </FieldGroup>
                <Button disabled={closeCash.isPending}>{closeCash.isPending ? "Cerrando..." : "Cerrar caja"}</Button>
              </form>
            ) : (
              <form className="space-y-3" onSubmit={handleOpen}>
                <FieldGroup className="gap-3">
                  <Field>
                    <FieldLabel htmlFor="saldo_inicial">Saldo inicial</FieldLabel>
                    <Input id="saldo_inicial" name="saldo_inicial" type="number" step="0.01" required />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="observaciones_apertura">Observaciones</FieldLabel>
                    <Input id="observaciones_apertura" name="observaciones" />
                  </Field>
                </FieldGroup>
                <Button disabled={openCash.isPending}>{openCash.isPending ? "Abriendo..." : "Abrir caja"}</Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <CardDescription>Cajas abiertas y cerradas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {cashQuery.isLoading ? <div className="text-sm text-muted-foreground">Cargando cajas...</div> : (
              <Table>
                <TableHeader>
                  <TableRow><TableHead>Fecha</TableHead><TableHead>Usuario</TableHead><TableHead>Saldo</TableHead><TableHead>Estado</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {(cashQuery.data?.data ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.fechaApertura)}</TableCell>
                      <TableCell>{item.usuario || "-"}</TableCell>
                      <TableCell>{formatCurrency(item.saldoFinal ?? item.saldoInicial)}</TableCell>
                      <TableCell><Badge variant={item.activo ? "secondary" : "outline"}>{item.activo ? "Abierta" : "Cerrada"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {cashQuery.data ? <AdminPager page={cashQuery.data.page} totalPages={cashQuery.data.totalPages} total={cashQuery.data.total} disabled={cashQuery.isFetching} onPrevious={() => setPage((value) => value - 1)} onNext={() => setPage((value) => value + 1)} /> : null}
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
