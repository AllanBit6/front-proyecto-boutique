import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

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
import { ResetPasswordForm } from "@/features/usuarios/components/ResetPasswordForm"
import { UserForm } from "@/features/usuarios/components/UserForm"
import { UsersTable } from "@/features/usuarios/components/UsersTable"
import {
  useDeleteUser,
  useRoles,
  useUser,
  useUsers,
} from "@/features/usuarios/hooks/useUsers"
import type { User } from "@/features/usuarios/types/user"

const PAGE_SIZE = 10

export function UsuariosPage() {
  const [page, setPage] = useState(1)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)
  const usersQuery = useUsers({ page, limit: PAGE_SIZE })
  const rolesQuery = useRoles()
  const editUserQuery = useUser(editingUserId)
  const deleteUserMutation = useDeleteUser()
  const usersData = usersQuery.data
  const roles = rolesQuery.data ?? []

  async function handleDelete() {
    if (!deleteUser) {
      return
    }

    await deleteUserMutation.mutateAsync(deleteUser.id)
    setDeleteUser(null)
  }

  return (
    <>
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Equipo</CardTitle>
              <CardDescription>
                Personas que pueden entrar al sistema.
              </CardDescription>
            </div>
            {usersData ? (
              <div className="text-sm text-muted-foreground">
                {usersData.total} registros
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {usersQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">
                Cargando usuarios...
              </div>
            ) : usersQuery.isError ? (
              <div className="text-sm text-destructive">
                No se pudieron cargar los usuarios.
              </div>
            ) : (
              <UsersTable
                users={usersData?.users ?? []}
                onEdit={(user) => setEditingUserId(user.id)}
                onResetPassword={setResetUser}
                onDelete={setDeleteUser}
              />
            )}
            {usersData ? (
              <div className="flex items-center justify-between gap-3 border-t pt-4">
                <div className="text-sm text-muted-foreground">
                  Pagina {usersData.page} de {usersData.totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || usersQuery.isFetching}
                    onClick={() => setPage((currentPage) => currentPage - 1)}
                  >
                    <ChevronLeft />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      page >= usersData.totalPages || usersQuery.isFetching
                    }
                    onClick={() => setPage((currentPage) => currentPage + 1)}
                  >
                    Siguiente
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Nueva persona</CardTitle>
            <CardDescription>
              Define sus datos y que puede hacer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rolesQuery.isLoading ? (
              <div className="text-sm text-muted-foreground">
                Cargando roles...
              </div>
            ) : (
              <UserForm roles={roles} />
            )}
          </CardContent>
        </Card>
      </section>

      <Dialog
        open={Boolean(editingUserId)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUserId(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Actualiza los datos y rol del usuario.
            </DialogDescription>
          </DialogHeader>
          {editUserQuery.isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando usuario...
            </div>
          ) : editUserQuery.data ? (
            <UserForm
              roles={roles}
              user={editUserQuery.data}
              onSuccess={() => setEditingUserId(null)}
            />
          ) : (
            <div className="text-sm text-destructive">
              No se pudo cargar el usuario.
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resetUser)}
        onOpenChange={(open) => {
          if (!open) {
            setResetUser(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resetear contrasena</DialogTitle>
            <DialogDescription>
              Define una contrasena temporal para {resetUser?.user_name}.
            </DialogDescription>
          </DialogHeader>
          {resetUser ? (
            <ResetPasswordForm
              user={resetUser}
              onSuccess={() => setResetUser(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(deleteUser)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteUser(null)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              Esta accion eliminara a {deleteUser?.user_name}. No se puede
              deshacer desde esta pantalla.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteUserMutation.isPending}
              onClick={() => void handleDelete()}
            >
              {deleteUserMutation.isPending ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
