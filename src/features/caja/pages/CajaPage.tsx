import { useMemo, useState } from "react"
import { toast } from "sonner"

import { AdminPager } from "@/features/admin/components/AdminTable"
import { formatCurrency, formatDate } from "@/features/admin/utils/formatters"
import {
  matchesDateRange,
  matchesTextSearch,
} from "@/features/admin/utils/tableFilters"
import {
  useActiveCashRegister,
  useCashRegisters,
  useCloseCashRegister,
  useOpenCashRegister,
} from "@/features/admin/hooks/useAdmin"
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
import { Badge } from "@/components/ui/badge"
import {
  FormSkeleton,
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

const PAGE_SIZE = 10

export function CajaPage() {
  const [page, setPage] = useState(1)
  const [cashSearch, setCashSearch] = useState("")
  const [cashDateFrom, setCashDateFrom] = useState("")
  const [cashDateTo, setCashDateTo] = useState("")
  const [cashStatus, setCashStatus] = useState("all")
  const activeCashQuery = useActiveCashRegister()
  const cashQuery = useCashRegisters({ page, limit: PAGE_SIZE })
  const openCash = useOpenCashRegister()
  const closeCash = useCloseCashRegister()
  const activeCash = activeCashQuery.data
  const cashCardTitle =
    activeCashQuery.isLoading || activeCashQuery.isError
      ? "Estado de caja"
      : activeCash
        ? "Caja activa"
        : "Abrir caja"
  const hasActiveCashFilters = Boolean(
    cashSearch.trim() || cashDateFrom || cashDateTo || cashStatus !== "all"
  )
  const filteredCashRegisters = useMemo(
    () =>
      (cashQuery.data?.data ?? []).filter(
        (item) =>
          matchesTextSearch(cashSearch, [
            item.id,
            item.usuario,
            item.saldoInicial,
            item.saldoFinal,
            item.observaciones,
          ]) &&
          matchesDateRange(item.fechaApertura, cashDateFrom, cashDateTo) &&
          (cashStatus === "all" ||
            (cashStatus === "active" ? item.activo : !item.activo))
      ),
    [cashDateFrom, cashDateTo, cashQuery.data?.data, cashSearch, cashStatus]
  )

  async function handleOpen(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const promise = openCash.mutateAsync({
      saldo_inicial: Number(form.get("saldo_inicial") ?? 0),
      observaciones: String(form.get("observaciones") ?? ""),
    })
    toast.promise(promise, {
      loading: "Abriendo caja...",
      success: "Caja abierta correctamente.",
      error: (error) => getErrorMessage(error, "No se pudo abrir la caja."),
    })

    try {
      await promise
      event.currentTarget.reset()
    } catch {
      // toast.promise displays the error.
    }
  }

  async function handleClose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCash) return
    const form = new FormData(event.currentTarget)
    const promise = closeCash.mutateAsync({
      id: activeCash.id,
      saldo_final: Number(form.get("saldo_final") ?? 0),
      observaciones: String(form.get("observaciones") ?? ""),
    })
    toast.promise(promise, {
      loading: "Cerrando caja...",
      success: "Caja cerrada correctamente.",
      error: (error) => getErrorMessage(error, "No se pudo cerrar la caja."),
    })

    try {
      await promise
      event.currentTarget.reset()
    } catch {
      // toast.promise displays the error.
    }
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Caja</h1>
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>{cashCardTitle}</CardTitle>
            {activeCash ? (
              <CardDescription>
                Abierta: {formatDate(activeCash.fechaApertura)}
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            {activeCashQuery.isLoading ? (
              <FormSkeleton fields={2} />
            ) : activeCashQuery.isError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                No se pudo confirmar el estado de caja.
              </div>
            ) : activeCash ? (
              <LoadTransition>
                <form className="space-y-3" onSubmit={handleClose}>
                  <div className="rounded-lg border p-3 text-sm">
                    Saldo inicial:{" "}
                    <strong>{formatCurrency(activeCash.saldoInicial)}</strong>
                  </div>
                  <FieldGroup className="gap-3">
                    <Field>
                      <FieldLabel htmlFor="saldo_final">Saldo final</FieldLabel>
                      <Input
                        id="saldo_final"
                        name="saldo_final"
                        type="number"
                        step="0.01"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="observaciones_cierre">
                        Observaciones
                      </FieldLabel>
                      <Input id="observaciones_cierre" name="observaciones" />
                    </Field>
                  </FieldGroup>
                  <Button disabled={closeCash.isPending}>
                    {closeCash.isPending ? "Cerrando..." : "Cerrar caja"}
                  </Button>
                </form>
              </LoadTransition>
            ) : (
              <LoadTransition>
                <form className="space-y-3" onSubmit={handleOpen}>
                  <FieldGroup className="gap-3">
                    <Field>
                      <FieldLabel htmlFor="saldo_inicial">
                        Saldo inicial
                      </FieldLabel>
                      <Input
                        id="saldo_inicial"
                        name="saldo_inicial"
                        type="number"
                        step="0.01"
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="observaciones_apertura">
                        Observaciones
                      </FieldLabel>
                      <Input id="observaciones_apertura" name="observaciones" />
                    </Field>
                  </FieldGroup>
                  <Button disabled={openCash.isPending}>
                    {openCash.isPending ? "Abriendo..." : "Abrir caja"}
                  </Button>
                </form>
              </LoadTransition>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Historial</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_160px_160px_150px]">
              <Input
                value={cashSearch}
                onChange={(event) => {
                  setCashSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar ID, usuario u observaciones"
              />
              <Input
                type="date"
                value={cashDateFrom}
                onChange={(event) => {
                  setCashDateFrom(event.target.value)
                  setPage(1)
                }}
              />
              <Input
                type="date"
                value={cashDateTo}
                onChange={(event) => {
                  setCashDateTo(event.target.value)
                  setPage(1)
                }}
              />
              <Select
                value={cashStatus}
                onValueChange={(value) => {
                  setCashStatus(value ?? "all")
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-full">
                  <span>
                    {cashStatus === "active"
                      ? "Abiertas"
                      : cashStatus === "closed"
                        ? "Cerradas"
                        : "Todo estado"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo estado</SelectItem>
                  <SelectItem value="active">Abiertas</SelectItem>
                  <SelectItem value="closed">Cerradas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasActiveCashFilters ? (
              <div className="text-xs text-muted-foreground">
                {filteredCashRegisters.length} resultados
              </div>
            ) : null}
            {cashQuery.isLoading ? (
              <TableSkeleton columns={4} />
            ) : cashQuery.isError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {getErrorMessage(
                  cashQuery.error,
                  "No se pudo cargar el historial de caja."
                )}
              </div>
            ) : (
              <LoadTransition>
                <div className="rounded-md border">
                  <Table className="min-w-[420px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Saldo</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCashRegisters.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            {formatDate(item.fechaApertura)}
                          </TableCell>
                          <TableCell className="max-w-36 whitespace-normal">
                            {item.usuario || "-"}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(
                              item.saldoFinal ?? item.saldoInicial
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={item.activo ? "secondary" : "outline"}
                            >
                              {item.activo ? "Abierta" : "Cerrada"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!filteredCashRegisters.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
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
            {cashQuery.data ? (
              <AdminPager
                page={cashQuery.data.page}
                totalPages={cashQuery.data.totalPages}
                total={cashQuery.data.total}
                disabled={cashQuery.isFetching}
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

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}
