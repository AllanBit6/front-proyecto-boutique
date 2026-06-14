import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LockKeyhole,
  Plus,
  ShoppingCart,
} from "lucide-react"
import { toast } from "sonner"

import { AdminPager } from "@/features/admin/components/AdminTable"
import { formatCurrency, formatDate } from "@/features/admin/utils/formatters"
import {
  matchesDateRange,
  matchesTextSearch,
} from "@/features/admin/utils/tableFilters"
import {
  useActiveCashRegister,
  useCashRegisterDetail,
  useCashRegisters,
  useCloseCashRegister,
  useOpenCashRegister,
  useSaleDetail,
} from "@/features/admin/hooks/useAdmin"
import type {
  CashMovement,
  CashRegister,
  CashRegisterDetail,
} from "@/features/admin/services/adminService"
import { useAuthStore } from "@/store"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  DetailSkeleton,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { moneyValue, normalizeTextInput } from "@/shared/utils/security"

const PAGE_SIZE = 10

export function CajaPage() {
  const user = useAuthStore((state) => state.user)
  const role = useAuthStore((state) => state.role)
  const [page, setPage] = useState(1)
  const [cashSearch, setCashSearch] = useState("")
  const [cashDateFrom, setCashDateFrom] = useState("")
  const [cashDateTo, setCashDateTo] = useState("")
  const [cashStatus, setCashStatus] = useState("all")
  const [selectedCashId, setSelectedCashId] = useState<string>()
  const [selectedSaleId, setSelectedSaleId] = useState<string>()
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false)
  const [closingCashId, setClosingCashId] = useState<string>()
  const [closingAmount, setClosingAmount] = useState("")
  const [closeConfirmation, setCloseConfirmation] =
    useState<CloseConfirmation | null>(null)
  const detailPanelRef = useRef<HTMLDivElement>(null)
  const openButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpenDialogOpen) {
      openButtonRef.current?.focus()
    }
  }, [isOpenDialogOpen])

  useEffect(() => {
    if (!selectedSaleId) {
      openButtonRef.current?.focus()
    }
  }, [selectedSaleId])

  const activeCashQuery = useActiveCashRegister()
  const cashQuery = useCashRegisters({ page, limit: PAGE_SIZE })
  const openCash = useOpenCashRegister()
  const closeCash = useCloseCashRegister()
  const activeCash = activeCashQuery.data
  const currentPageCash = useMemo(
    () => cashQuery.data?.data ?? [],
    [cashQuery.data?.data]
  )
  const ownActiveCash = useMemo(() => {
    const ownFromPage = currentPageCash.find(
      (item) => item.activo && item.usuarioId === user?.id
    )

    if (ownFromPage) {
      return ownFromPage
    }

    if (activeCash?.activo && activeCash.usuarioId === user?.id) {
      return activeCash
    }

    return null
  }, [activeCash, currentPageCash, user?.id])
  const effectiveSelectedCashId =
    selectedCashId ?? ownActiveCash?.id ?? currentPageCash[0]?.id
  const selectedCashQuery = useCashRegisterDetail(effectiveSelectedCashId)
  const saleDetailQuery = useSaleDetail(selectedSaleId)
  const filteredCashRegisters = useMemo(
    () =>
      currentPageCash.filter(
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
            (cashStatus === "active"
              ? item.activo === true
              : item.activo === false))
      ),
    [cashDateFrom, cashDateTo, cashSearch, cashStatus, currentPageCash]
  )
  const selectedCash = selectedCashQuery.data
  const selectedTotals = useMemo(
    () => calculateCashTotals(selectedCash),
    [selectedCash]
  )
  const closingCash = selectedCash?.id === closingCashId ? selectedCash : null
  const isClosingCashLoading =
    Boolean(closingCashId) &&
    (!closingCash ||
      selectedCashQuery.isLoading ||
      selectedCashQuery.isFetching)
  const closingTotals = calculateCashTotals(closingCash)
  const closingDifference = moneyValue(closingAmount) - closingTotals.expected
  const canCloseSelected =
    selectedCash?.activo &&
    (role === "admin" || selectedCash.usuarioId === user?.id)

  async function handleOpen(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formEl = event.currentTarget
    const formData = new FormData(formEl)
    const observaciones =
      normalizeTextInput(formData.get("observaciones"), {
        maxLength: 240,
      }) || undefined

    try {
      const opened = await openCash.mutateAsync({
        saldo_inicial: moneyValue(formData.get("saldo_inicial")),
        observaciones,
      })

      toast.success("Caja abierta correctamente.")
      formEl.reset()
      setIsOpenDialogOpen(false)

      if (opened.id) {
        viewCashDetail(opened.id)
      }
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo abrir la caja."))
    }
  }

  async function handleClose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!closingCashId || !closingCash) {
      setErrorToast("Espera mientras se carga el detalle de caja.")
      return
    }

    const form = new FormData(event.currentTarget)
    const input = {
      id: closingCashId,
      saldo_final: moneyValue(form.get("saldo_final")),
      observaciones: normalizeTextInput(form.get("observaciones"), {
        maxLength: 240,
      }),
    }

    if (Math.abs(closingDifference) > 0.009) {
      setCloseConfirmation({
        ...input,
        expected: closingTotals.expected,
        difference: closingDifference,
      })
      return
    }

    await submitCloseCash(input, event.currentTarget)
  }

  async function submitCloseCash(
    input: CloseCashInput,
    form?: HTMLFormElement
  ) {
    try {
      await closeCash.mutateAsync(input)

      toast.success("Caja cerrada correctamente.")
      form?.reset()
      setClosingAmount("")
      setClosingCashId(undefined)
      setCloseConfirmation(null)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo cerrar la caja."))
    }
  }

  function requestClose(cash: CashRegister) {
    viewCashDetail(cash.id)
    setClosingCashId(cash.id)
    setClosingAmount("")
  }

  function viewCashDetail(id: string) {
    setSelectedCashId(id)

    if (effectiveSelectedCashId === id) {
      void selectedCashQuery.refetch()
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-heading">Caja</h1>
          <p className="text-sm text-muted-foreground">
            Apertura y cierre manual por usuario.
          </p>
        </div>
        <Button
          type="button"
          ref={openButtonRef}
          disabled={Boolean(ownActiveCash) || activeCashQuery.isLoading}
          title={
            activeCashQuery.isLoading
              ? "Verificando caja activa..."
              : ownActiveCash
                ? "Ya tienes una caja abierta"
                : "Abrir nueva caja"
          }
          onClick={() => setIsOpenDialogOpen(true)}
        >
          <Plus />
          Abrir caja
        </Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Listado de cajas</CardTitle>
            <CardDescription>
              {role === "admin"
                ? "Administración de todas las cajas registradas."
                : "Tus aperturas y cierres de caja."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-4">
              <Input
                value={cashSearch}
                onChange={(event) => {
                  setCashSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Buscar usuario, ID u observaciones..."
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
                  <span className="truncate">
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

            {cashQuery.isLoading ? (
              <TableSkeleton columns={9} />
            ) : cashQuery.isError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {getErrorMessage(
                  cashQuery.error,
                  "No se pudo cargar el listado de caja."
                )}
              </div>
            ) : (
              <LoadTransition>
                <div className="overflow-auto rounded-md border">
                  <Table className="min-w-[980px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Apertura</TableHead>
                        <TableHead>Cierre</TableHead>
                        <TableHead className="text-right">
                          Saldo inicial
                        </TableHead>
                        <TableHead className="text-right">
                          Saldo final
                        </TableHead>
                        <TableHead className="text-right">Ventas</TableHead>
                        <TableHead className="text-right">Mov.</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCashRegisters.map((item) => (
                        <TableRow
                          key={item.id}
                          className={cn(
                            "cursor-pointer",
                            item.id === effectiveSelectedCashId && "bg-muted/30"
                          )}
                          onClick={() => viewCashDetail(item.id)}
                        >
                          <TableCell>
                            <CashStatusBadge activo={item.activo} />
                          </TableCell>
                          <TableCell className="max-w-44 whitespace-normal">
                            {item.usuario || "-"}
                          </TableCell>
                          <TableCell>
                            {formatDate(item.fechaApertura)}
                          </TableCell>
                          <TableCell>{formatDate(item.fechaCierre)}</TableCell>
                          <TableCell className="text-right">
                            {formatOptionalCurrency(item.saldoInicial)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatOptionalCurrency(item.saldoFinal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatOptionalCount(item.ventasCount)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatOptionalCount(item.movimientosCount)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      ))}
                      {!filteredCashRegisters.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="py-8 text-center text-sm text-muted-foreground"
                          >
                            Sin cajas para mostrar.
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

        <Card ref={detailPanelRef}>
          <CardHeader>
            <CardTitle>Detalle</CardTitle>
            <CardDescription>
              {selectedCash
                ? `${selectedCash.usuario || "Usuario"} - ${cashStatusLabel(selectedCash.activo).toLocaleLowerCase()}`
                : "Selecciona una caja."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCashQuery.isLoading && !selectedCash ? (
              <FormSkeleton fields={5} />
            ) : selectedCash ? (
              <CashDetailPanel
                cash={selectedCash}
                totals={selectedTotals}
                canClose={Boolean(canCloseSelected)}
                onClose={() => requestClose(selectedCash)}
                onViewSale={setSelectedSaleId}
                isRefreshing={selectedCashQuery.isFetching}
              />
            ) : selectedCashQuery.isError ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {getErrorMessage(
                  selectedCashQuery.error,
                  "No se pudo cargar el detalle de caja."
                )}
              </div>
            ) : (
              <div className="rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground">
                No hay una caja seleccionada.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Abrir caja</DialogTitle>
            <DialogDescription>
              La caja se abre para tu usuario actual.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleOpen}>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="saldo_inicial">Saldo inicial</FieldLabel>
                <Input
                  id="saldo_inicial"
                  name="saldo_inicial"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  autoComplete="off"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="observaciones_apertura">
                  Observaciones
                </FieldLabel>
                <Textarea
                  id="observaciones_apertura"
                  name="observaciones"
                  maxLength={240}
                  autoComplete="off"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={openCash.isPending || Boolean(ownActiveCash)}
              >
                {openCash.isPending ? "Abriendo..." : "Abrir caja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(closingCashId)}
        onOpenChange={(open) => {
          if (!open && !closeCash.isPending) {
            setClosingCashId(undefined)
            setClosingAmount("")
            setCloseConfirmation(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar caja</DialogTitle>
            <DialogDescription>
              Ingresa el saldo final contado antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleClose}>
            {isClosingCashLoading ? (
              <FormSkeleton fields={4} />
            ) : (
              <div className="grid gap-2 rounded-md border p-3 text-sm">
                <MoneyLine
                  label="Saldo inicial"
                  value={closingTotals.initial}
                />
                <MoneyLine
                  label="Ingresos registrados"
                  value={closingTotals.income}
                />
                <MoneyLine
                  label="Egresos registrados"
                  value={closingTotals.expenses}
                />
                <MoneyLine
                  label="Saldo estimado por movimientos"
                  value={closingTotals.expected}
                />
                <MoneyLine
                  label="Diferencia contra estimado"
                  value={closingAmount ? closingDifference : 0}
                  strong
                  colorClass={
                    !closingAmount
                      ? ""
                      : Math.abs(closingDifference) === 0
                        ? "text-emerald-600 dark:text-emerald-500"
                        : Math.abs(closingDifference) < 10
                          ? "text-amber-600 dark:text-amber-500"
                          : "text-destructive"
                  }
                />
              </div>
            )}
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="saldo_final">Saldo contado</FieldLabel>
                <Input
                  id="saldo_final"
                  name="saldo_final"
                  type="number"
                  step="0.01"
                  min="0"
                  max="999999.99"
                  autoComplete="off"
                  value={closingAmount}
                  onChange={(event) => setClosingAmount(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="observaciones_cierre">
                  Observaciones
                </FieldLabel>
                <Textarea
                  id="observaciones_cierre"
                  name="observaciones"
                  maxLength={240}
                  autoComplete="off"
                />
              </Field>
            </FieldGroup>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setClosingCashId(undefined)
                  setClosingAmount("")
                }}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  closeCash.isPending || !closingCashId || isClosingCashLoading
                }
              >
                {closeCash.isPending ? "Cerrando..." : "Cerrar caja"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(closeConfirmation)}
        onOpenChange={(open) => {
          if (!open) {
            setCloseConfirmation(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar diferencia de caja</DialogTitle>
            <DialogDescription>
              Revisa el arqueo antes de cerrar la caja.
            </DialogDescription>
          </DialogHeader>
          {closeConfirmation ? (
            <div className="grid gap-2 rounded-md border p-3 text-sm">
              <MoneyLine
                label="Saldo estimado por movimientos"
                value={closeConfirmation.expected}
              />
              <MoneyLine
                label="Saldo contado"
                value={closeConfirmation.saldo_final}
              />
              <MoneyLine
                label="Diferencia contra estimado"
                value={closeConfirmation.difference}
                strong
                colorClass={
                  Math.abs(closeConfirmation.difference) === 0
                    ? "text-emerald-600 dark:text-emerald-500"
                    : Math.abs(closeConfirmation.difference) < 10
                      ? "text-amber-600 dark:text-amber-500"
                      : "text-destructive"
                }
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={closeCash.isPending}
              onClick={() => setCloseConfirmation(null)}
            >
              Revisar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={closeCash.isPending || !closeConfirmation}
              onClick={() => {
                if (closeConfirmation) {
                  void submitCloseCash({
                    id: closeConfirmation.id,
                    saldo_final: closeConfirmation.saldo_final,
                    observaciones: closeConfirmation.observaciones,
                  })
                }
              }}
            >
              {closeCash.isPending ? "Cerrando..." : "Cerrar caja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            <DialogDescription>
              Información completa de la venta asociada a caja.
            </DialogDescription>
          </DialogHeader>
          {saleDetailQuery.isLoading ? (
            <DetailSkeleton items={4} />
          ) : saleDetailQuery.data ? (
            <LoadTransition>
              <SaleDetailContent sale={saleDetailQuery.data} />
            </LoadTransition>
          ) : saleDetailQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {getErrorMessage(
                saleDetailQuery.error,
                "No se pudo cargar el detalle de venta."
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  )
}

function CashDetailPanel({
  cash,
  totals,
  canClose,
  onClose,
  onViewSale,
  isRefreshing,
}: {
  cash: CashRegisterDetail
  totals: CashTotals
  canClose: boolean
  onClose: () => void
  onViewSale: (id: string) => void
  isRefreshing?: boolean
}) {
  const finalBalance = cash.saldoFinal ?? totals.expected
  const difference =
    cash.saldoFinal === undefined ? 0 : finalBalance - totals.expected

  return (
    <div className="space-y-4">
      {cash.activo && canClose ? (
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Caja activa
            </Badge>
            <span className="text-sm text-muted-foreground">
              Estimado por movimientos:{" "}
              <span className="font-medium tabular-nums">
                {formatCurrency(totals.expected)}
              </span>
            </span>
          </div>
          <Button type="button" className="w-full" onClick={onClose}>
            <LockKeyhole />
            Cerrar caja y realizar arqueo
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CashStatusBadge activo={cash.activo} />
          {isRefreshing ? (
            <span className="text-xs text-muted-foreground">Actualizando...</span>
          ) : null}
        </div>
      )}

      <dl className="grid gap-2 text-sm">
        <InfoLine label="Usuario" value={cash.usuario || "-"} />
        <InfoLine label="Apertura" value={formatDate(cash.fechaApertura)} />
        <InfoLine label="Cierre" value={formatDate(cash.fechaCierre)} />
        <InfoLine label="Observaciones" value={cash.observaciones || "-"} />
      </dl>

      <div className="grid gap-2 rounded-md border p-3 text-sm">
        <MoneyLine label="Saldo inicial" value={totals.initial} />
        <MoneyLine label="Ingresos registrados" value={totals.income} />
        <MoneyLine label="Egresos registrados" value={totals.expenses} />
        <MoneyLine
          label="Saldo estimado por movimientos"
          value={totals.expected}
          strong
        />
        <p className="text-xs text-muted-foreground">
          Estimación calculada solo con movimientos recibidos por el endpoint de
          caja.
        </p>
        <MoneyLine
          label="Saldo final"
          value={cash.saldoFinal}
          placeholder={cash.activo ? "Pendiente" : "-"}
        />
        <MoneyLine
          label="Diferencia contra estimado"
          value={difference}
          placeholder={cash.activo ? "Pendiente" : undefined}
          colorClass={
            cash.activo || cash.saldoFinal === undefined
              ? ""
              : Math.abs(difference) === 0
                ? "text-emerald-600 dark:text-emerald-500"
                : Math.abs(difference) < 10
                  ? "text-amber-600 dark:text-amber-500"
                  : "text-destructive"
          }
        />
      </div>

      <Tabs defaultValue="movimientos">
        <TabsList className="w-full">
          <TabsTrigger value="movimientos">
            Movimientos ({cash.movimientos.length})
          </TabsTrigger>
          <TabsTrigger value="ventas">
            Ventas ({cash.ventas.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="movimientos">
          <CashMovementsTable movements={cash.movimientos} />
        </TabsContent>
        <TabsContent value="ventas">
          <CashSalesTable sales={cash.ventas} onViewSale={onViewSale} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CashMovementsTable({ movements }: { movements: CashMovement[] }) {
  if (movements.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
        <ArrowDownCircle className="mx-auto mb-2 size-8 text-muted-foreground/50" />
        Sin movimientos.
      </div>
    )
  }

  return (
    <div className="max-h-[300px] overflow-auto rounded-md border">
      <Table className="min-w-[520px]">
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Monto</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movements.map((movement) => {
            const isIncome = movement.tipo === "INGRESO"
            const Icon = isIncome ? ArrowUpCircle : ArrowDownCircle

            return (
              <TableRow key={movement.id}>
                <TableCell>
                  <span className="inline-flex items-center gap-1">
                    <Icon className="size-4 text-muted-foreground" />
                    {movement.tipo}
                  </span>
                </TableCell>
                <TableCell className="max-w-44 whitespace-normal">
                  {movement.motivo || "-"}
                  {movement.ventaId ? (
                    <div className="text-xs text-muted-foreground">
                      Venta: {movement.ventaId.slice(0, 8)}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell>{formatDate(movement.fecha)}</TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  {isIncome ? "+" : "-"}
                  {formatCurrency(movement.monto)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function CashSalesTable({
  sales,
  onViewSale,
}: {
  sales: CashRegisterDetail["ventas"]
  onViewSale: (id: string) => void
}) {
  if (sales.length === 0) {
    return (
      <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
        <ShoppingCart className="mx-auto mb-2 size-8 text-muted-foreground/50" />
        Sin ventas asociadas.
      </div>
    )
  }

  return (
    <div className="max-h-[300px] overflow-auto rounded-md border">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Venta</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="w-24 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => (
            <TableRow key={sale.id}>
              <TableCell className="font-medium">
                {sale.id.slice(0, 8)}
              </TableCell>
              <TableCell>{formatDate(sale.fecha)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatOptionalCurrency(sale.total)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onViewSale(sale.id)}
                >
                  Detalle
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function SaleDetailContent({
  sale,
}: {
  sale: NonNullable<ReturnType<typeof useSaleDetail>["data"]>
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-md border p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <InfoBlock label="Fecha" value={formatDate(sale.fecha)} />
        <InfoBlock label="Cliente" value={sale.cliente || "Consumidor final"} />
        <InfoBlock label="NIT" value={sale.nit || "CF"} />
        <InfoBlock label="Vendedor" value={sale.usuario || "-"} />
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
            {sale.detalles.length > 0 ? (
              sale.detalles.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.prenda || "-"}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.marca_nombre || ""}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {item.sku || item.codigoBarras || "Sin código"}
                    </div>
                  </TableCell>
                  <TableCell>{item.cantidad}</TableCell>
                  <TableCell className="tabular-nums">
                    {formatOptionalCurrency(item.precioUnitario)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatOptionalCurrency(item.subtotal)}
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
              <TableHead>Método</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Recibido</TableHead>
              <TableHead className="text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sale.pagos.length > 0 ? (
              sale.pagos.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.metodo || "-"}</TableCell>
                  <TableCell>{item.numeroReferencia || "-"}</TableCell>
                  <TableCell className="tabular-nums">
                    {item.montoRecibido === undefined
                      ? "-"
                      : formatCurrency(item.montoRecibido)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatOptionalCurrency(item.monto)}
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
        Total: {formatOptionalCurrency(sale.total)}
      </div>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  )
}

interface CashTotals {
  initial?: number
  income: number
  expenses: number
  expected: number
}

interface CloseCashInput {
  id: string
  saldo_final: number
  observaciones?: string
}

interface CloseConfirmation extends CloseCashInput {
  expected: number
  difference: number
}

function calculateCashTotals(
  cash?: CashRegister | CashRegisterDetail | null
): CashTotals {
  const movements = cash && "movimientos" in cash ? cash.movimientos : []
  const income = movements
    .filter((movement) => movement.tipo === "INGRESO")
    .reduce((sum, movement) => sum + movement.monto, 0)
  const expenses = movements
    .filter((movement) => movement.tipo === "EGRESO")
    .reduce((sum, movement) => sum + movement.monto, 0)
  const initial = cash?.saldoInicial

  return {
    initial,
    income,
    expenses,
    expected: (initial ?? 0) + income - expenses,
  }
}

function formatOptionalCurrency(value?: number) {
  return value === undefined || Number.isNaN(value) ? "-" : formatCurrency(value)
}

function formatOptionalCount(value?: number) {
  return value === undefined || Number.isNaN(value) ? "-" : String(value)
}

function cashStatusLabel(activo?: boolean) {
  if (activo === true) {
    return "Abierta"
  }

  if (activo === false) {
    return "Cerrada"
  }

  return "Sin estado"
}

function CashStatusBadge({ activo }: { activo?: boolean }) {
  return (
    <Badge variant={activo === true ? "secondary" : "outline"}>
      {cashStatusLabel(activo)}
    </Badge>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 font-medium break-words">{value}</dd>
    </div>
  )
}

function MoneyLine({
  label,
  value,
  placeholder,
  strong,
  colorClass,
}: {
  label: string
  value?: number
  placeholder?: string
  strong?: boolean
  colorClass?: string
}) {
  const content =
    value === undefined || Number.isNaN(value)
      ? (placeholder ?? "-")
      : formatCurrency(value)

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`${strong ? "font-semibold" : "font-medium"} tabular-nums ${colorClass ?? ""}`}
      >
        {content}
      </span>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function setErrorToast(message: string) {
  toast.error(message)
}
