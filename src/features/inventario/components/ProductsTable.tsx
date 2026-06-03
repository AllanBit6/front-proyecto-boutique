import { Edit, MoreHorizontal, Trash2 } from "lucide-react"

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
import type { Product } from "@/features/inventario/types/product"

interface ProductsTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  showActions?: boolean
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  showActions = true,
}: ProductsTableProps) {
  if (!products.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        No hay modelos base para mostrar.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Modelo</TableHead>
          <TableHead>Marca</TableHead>
          <TableHead>Estado</TableHead>
          {showActions ? <TableHead className="w-10" /> : null}
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell>
              <div className="font-medium">{product.nombre}</div>
              <div className="text-xs text-muted-foreground">
                {product.caracteristica_distintiva}
              </div>
            </TableCell>
            <TableCell>{product.marca_nombre || product.marca_id}</TableCell>
            <TableCell>
              <Badge variant={product.activo ? "secondary" : "outline"}>
                {product.activo ? "Activo" : "Desactivado"}
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
                        aria-label="Acciones de producto"
                      />
                    }
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onClick={() => onEdit(product)}>
                      <Edit />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(product)}
                    >
                      <Trash2 />
                      Desactivar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            ) : null}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
