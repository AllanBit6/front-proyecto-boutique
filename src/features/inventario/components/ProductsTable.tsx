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
        Sin modelos.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table className="min-w-[420px]">
        <TableHeader>
          <TableRow>
            <TableHead>Modelo</TableHead>
            <TableHead className="hidden sm:table-cell">Marca</TableHead>
            <TableHead className="hidden sm:table-cell">Estado</TableHead>
            {showActions ? <TableHead className="w-10" /> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="max-w-56 whitespace-normal">
                <div className="font-medium">{product.nombre}</div>
                <div className="text-xs text-muted-foreground">
                  {product.caracteristica_distintiva}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                  <span className="text-xs text-muted-foreground">
                    {product.marca_nombre || product.marca_id}
                  </span>
                  <Badge variant={product.activo ? "secondary" : "outline"}>
                    {product.activo ? "Activo" : "Desactivado"}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {product.marca_nombre || product.marca_id}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
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
    </div>
  )
}
