import { Edit, KeyRound, MoreHorizontal, Trash2 } from "lucide-react"

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
import type { User } from "@/features/usuarios/types/user"

interface UsersTableProps {
  users: User[]
  onEdit: (user: User) => void
  onResetPassword: (user: User) => void
  onDelete: (user: User) => void
}

export function UsersTable({
  users,
  onEdit,
  onResetPassword,
  onDelete,
}: UsersTableProps) {
  if (!users.length) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Sin usuarios.
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table className="min-w-[420px]">
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="hidden sm:table-cell">Acceso</TableHead>
            <TableHead>Permiso</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="max-w-48 whitespace-normal">
                <div className="font-medium">
                  {user.nombre} {user.apellido}
                </div>
                <div className="text-xs text-muted-foreground sm:hidden">
                  {user.user_name}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {user.user_name}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {user.rol_nombre || user.rol_id}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Acciones de usuario"
                      />
                    }
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onResetPassword(user)}>
                      <KeyRound />
                      Cambiar contraseña
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => onDelete(user)}
                    >
                      <Trash2 />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
