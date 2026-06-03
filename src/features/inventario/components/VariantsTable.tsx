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
}

export function VariantsTable({
  variants,
  onEdit,
  onDelete,
  onBarcode,
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
          <TableHead>Codigo</TableHead>
          <TableHead>Prenda</TableHead>
          <TableHead>Talla / color</TableHead>
          <TableHead className="text-right">Precio</TableHead>
          <TableHead>Disponibles</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((variant) => {
          const lowStock = variant.stock_actual <= variant.stock_minimo

          return (
            <TableRow key={variant.id}>
              <TableCell>
                <div className="font-medium">{variant.sku}</div>
                <div className="text-xs text-muted-foreground">
                  {variant.codigo_barras}
                </div>
              </TableCell>
              <TableCell>{variant.producto_nombre || variant.producto_id}</TableCell>
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
                      Codigo
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
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
