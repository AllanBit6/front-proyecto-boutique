import { Barcode, Edit, MoreHorizontal, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Variant } from "@/features/inventario/types/product"

interface VariantsTableProps {
  variants: Variant[]
  onEdit: (variant: Variant) => void
  onDelete: (variant: Variant) => void
  onBarcode: (variant: Variant) => void
  showActions?: boolean
}

export function VariantsTable({
  variants,
  onEdit,
  onDelete,
  onBarcode,
  showActions = true,
}: VariantsTableProps) {
  if (!variants.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No hay prendas para mostrar.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>SKU</TableHead>
          <TableHead>Prenda</TableHead>
          <TableHead>Talla / color</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead>Stock</TableHead>
          <TableHead>Estado</TableHead>
          {showActions ? <TableHead className="w-10" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((variant) => {
          const lowStock = variant.stock_actual <= variant.stock_minimo

          return (
            <TableRow
              key={variant.id}
              className={!variant.activo ? "opacity-70" : undefined}
            >
              <TableCell className="font-medium">{variant.sku || "-"}</TableCell>
              <TableCell>
                {variant.producto_nombre || variant.producto_id}
              </TableCell>
              <TableCell>
                {variant.talla_nombre || variant.talla_id} /{" "}
                {variant.color_nombre || variant.color_id}
              </TableCell>
              <TableCell className="text-right">
                Q {variant.precio_venta.toFixed(2)}
              </TableCell>
              <TableCell>
                <Badge variant={lowStock ? "destructive" : "secondary"}>
                  {variant.stock_actual} disp.
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={variant.activo ? "secondary" : "outline"}>
                  {variant.activo ? "Activo" : "Desactivado"}
                </Badge>
              </TableCell>
              {showActions ? (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Acciones de variante"
                        />
                      }
                    >
                      <MoreHorizontal />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => onBarcode(variant)}>
                        <Barcode />
                        Ver codigo
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(variant)}>
                        <Edit />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(variant)}
                      >
                        <Trash2 />
                        Desactivar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              ) : null}
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
