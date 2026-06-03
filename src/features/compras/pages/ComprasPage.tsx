import { useState } from "react"

import {
  AdminPager,
  formatCurrency,
  formatDate,
} from "@/features/admin/components/AdminTable"
import {
  useCancelPurchase,
  useCreatePurchase,
  usePurchases,
} from "@/features/admin/hooks/useAdmin"
import { useVariants } from "@/features/inventario/hooks/useProducts"
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
  const purchasesQuery = usePurchases({ page, limit: PAGE_SIZE })
  const variantsQuery = useVariants({ page: 1, limit: 100 })
  const createPurchase = useCreatePurchase()
  const cancelPurchase = useCancelPurchase()

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    await createPurchase.mutateAsync({
      variante_id: variantId,
      cantidad: Number(form.get("cantidad") ?? 0),
      precio_unitario: Number(form.get("precio_unitario") ?? 0),
    })
    setVariantId("")
    event.currentTarget.reset()
  }

  async function handleCancel(id: string) {
    const motivo = window.prompt("Motivo de anulacion")
    if (!motivo) return
    await cancelPurchase.mutateAsync({ id, motivo })
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Compras</h1>
        <p className="page-subtitle">
          Registra producto recibido para sumar stock al inventario.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Producto recibido</CardTitle>
            <CardDescription>
              Selecciona la prenda y registra la cantidad recibida.
            </CardDescription>
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
              <Button disabled={createPurchase.isPending || !variantId}>
                {createPurchase.isPending ? "Guardando..." : "Sumar al stock"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Entradas registradas</CardTitle>
            <CardDescription>
              Producto recibido y cambios aplicados al inventario.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
                  {(purchasesQuery.data?.data ?? []).map((item) => (
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
