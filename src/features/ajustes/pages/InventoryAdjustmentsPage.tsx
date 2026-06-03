import { SlidersHorizontal } from "lucide-react"
import { useState } from "react"

import { AdminPager, formatDate } from "@/features/admin/components/AdminTable"
import {
  useCreateInventoryAdjustment,
  useInventoryMovements,
} from "@/features/admin/hooks/useAdmin"
import { useVariants } from "@/features/inventario/hooks/useProducts"
import { Badge } from "@/components/ui/badge"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

const ADJUSTMENT_TYPES = [
  { value: "INGRESO", label: "Entrada" },
  { value: "SALIDA", label: "Salida" },
  { value: "AJUSTE", label: "Correccion" },
]

export function InventoryAdjustmentsPage() {
  const [page, setPage] = useState(1)
  const [movementType, setMovementType] = useState("all")
  const [adjustmentType, setAdjustmentType] = useState("INGRESO")
  const [variantId, setVariantId] = useState("")
  const movementsQuery = useInventoryMovements({
    page,
    limit: PAGE_SIZE,
    tipo: movementType,
  })
  const variantsQuery = useVariants({ page: 1, limit: 100 })
  const createAdjustment = useCreateInventoryAdjustment()

  async function handleAdjustment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = new FormData(event.currentTarget)
    await createAdjustment.mutateAsync({
      variante_id: variantId,
      tipo: adjustmentType,
      cantidad: Number(form.get("cantidad") ?? 0),
      motivo: String(form.get("motivo") ?? ""),
    })

    setVariantId("")
    event.currentTarget.reset()
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Ajustar stock</h1>
        <p className="page-subtitle">
          Corrige cantidades cuando encuentres diferencias en tienda o bodega.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              Corregir cantidad
            </CardTitle>
            <CardDescription>
              Indica que prenda cambia, cuanto cambia y por que.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={handleAdjustment}>
              <FieldGroup className="gap-3">
                <Field>
                  <FieldLabel>Prenda</FieldLabel>
                  <Select
                    value={variantId}
                    onValueChange={(value) => setVariantId(value ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona prenda" />
                    </SelectTrigger>
                    <SelectContent>
                      {(variantsQuery.data?.data ?? []).map((variant) => (
                        <SelectItem key={variant.id} value={variant.id}>
                          {variant.producto_nombre} / {variant.talla_nombre} /{" "}
                          {variant.color_nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectValue />
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
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="motivo">Motivo</FieldLabel>
                  <Input
                    id="motivo"
                    name="motivo"
                    placeholder="Conteo fisico, merma, correccion..."
                    required
                  />
                </Field>
              </FieldGroup>
              <Button
                className="w-full"
                disabled={createAdjustment.isPending || !variantId}
              >
                {createAdjustment.isPending ? "Aplicando..." : "Aplicar ajuste"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Cambios de stock</CardTitle>
              <CardDescription>
                Entradas, salidas y correcciones registradas.
              </CardDescription>
            </div>
            <Select
              value={movementType}
              onValueChange={(value) => {
                setMovementType(value ?? "all")
                setPage(1)
              }}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
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
            {movementsQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">
                Cargando movimientos...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Prenda</TableHead>
                    <TableHead>Cambio</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(movementsQuery.data?.data ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.fecha)}</TableCell>
                      <TableCell>{item.prenda || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.tipo}</Badge>
                      </TableCell>
                      <TableCell>{item.cantidad}</TableCell>
                      <TableCell>{item.stockResultante}</TableCell>
                      <TableCell>{item.motivo || item.origen}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
