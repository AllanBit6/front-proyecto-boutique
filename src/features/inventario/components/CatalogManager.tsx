import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCreateColor,
  useCreateSize,
  useDeleteColor,
  useDeleteSize,
} from "@/features/inventario/hooks/useProducts"
import type { CatalogOption } from "@/features/inventario/types/product"
import { normalizeTextInput } from "@/shared/utils/security"

interface CatalogManagerProps {
  sizes: CatalogOption[]
  colors: CatalogOption[]
}

export function CatalogManager({ sizes, colors }: CatalogManagerProps) {
  return (
    <Tabs defaultValue="sizes">
      <TabsList>
        <TabsTrigger value="sizes">Tallas</TabsTrigger>
        <TabsTrigger value="colors">Colores</TabsTrigger>
      </TabsList>
      <TabsContent value="sizes" className="mt-3">
        <CatalogList
          items={sizes}
          itemLabel="talla"
          placeholder="Nueva talla"
          emptyText="No hay tallas activas."
          useCreate={useCreateSize}
          useDelete={useDeleteSize}
        />
      </TabsContent>
      <TabsContent value="colors" className="mt-3">
        <CatalogList
          items={colors}
          itemLabel="color"
          placeholder="Nuevo color"
          emptyText="No hay colores activos."
          useCreate={useCreateColor}
          useDelete={useDeleteColor}
        />
      </TabsContent>
    </Tabs>
  )
}

function CatalogList({
  items,
  itemLabel,
  placeholder,
  emptyText,
  useCreate,
  useDelete,
}: {
  items: CatalogOption[]
  itemLabel: string
  placeholder: string
  emptyText: string
  useCreate: typeof useCreateSize
  useDelete: typeof useDeleteSize
}) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [itemToDelete, setItemToDelete] = useState<CatalogOption | null>(null)
  const createItem = useCreate()
  const deleteItem = useDelete()
  const isPending = createItem.isPending || deleteItem.isPending
  const grammaticalGender = itemLabel === "color" ? "masculine" : "feminine"

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = normalizeTextInput(name, { maxLength: 40 })
    setError("")

    if (!trimmedName) {
      return
    }

    const alreadyExists = items.some(
      (item) =>
        item.nombre.trim().toLocaleLowerCase() ===
        trimmedName.toLocaleLowerCase()
    )

    if (alreadyExists) {
      setError(
        `Ya existe ${itemLabel === "color" ? "un" : "una"} ${itemLabel} con ese nombre.`
      )
      return
    }

    const promise = createItem.mutateAsync({ nombre: trimmedName })

    toast.promise(promise, {
      loading: `Creando ${itemLabel}...`,
      success: `${capitalize(itemLabel)} ${agreement(grammaticalGender, "creado", "creada")} correctamente.`,
      error: (error) =>
        getErrorMessage(error, `No se pudo crear ${itemLabel}.`),
    })

    try {
      await promise
      setName("")
    } catch (error) {
      setError(getErrorMessage(error, `No se pudo crear ${itemLabel}.`))
    }
  }

  async function handleDelete() {
    if (!itemToDelete) {
      return
    }

    const promise = deleteItem.mutateAsync(itemToDelete.id)

    toast.promise(promise, {
      loading: `Desactivando ${itemLabel}...`,
      success: `${capitalize(itemLabel)} ${agreement(grammaticalGender, "desactivado", "desactivada")} correctamente.`,
      error: (error) =>
        getErrorMessage(error, `No se pudo desactivar ${itemLabel}.`),
    })

    try {
      await promise
      setItemToDelete(null)
    } catch (error) {
      setError(getErrorMessage(error, `No se pudo desactivar ${itemLabel}.`))
    }
  }

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          value={name}
          placeholder={placeholder}
          maxLength={40}
          onChange={(event) =>
            setName(normalizeTextInput(event.target.value, { maxLength: 40 }))
          }
        />
        <Button
          type="submit"
          size="icon"
          aria-label={`Crear ${itemLabel}`}
          disabled={isPending || !name.trim()}
        >
          <Plus />
        </Button>
      </form>
      {error ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {items.length ? (
        <div className="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex min-w-0 items-center justify-between gap-2 rounded-lg border px-2 py-1.5"
            >
              <Badge variant="secondary" className="min-w-0 truncate">
                {item.nombre}
              </Badge>
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Desactivar ${item.nombre}`}
                disabled={isPending}
                onClick={() => {
                  setError("")
                  setItemToDelete(item)
                }}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {emptyText}
        </div>
      )}
      <Dialog
        open={Boolean(itemToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setItemToDelete(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desactivar {itemLabel}</DialogTitle>
            <DialogDescription>
              {itemToDelete?.nombre} dejará de aparecer como opción al registrar
              prendas nuevas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setItemToDelete(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending}
              onClick={() => void handleDelete()}
            >
              {deleteItem.isPending ? "Desactivando..." : "Desactivar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function capitalize(value: string) {
  return value.charAt(0).toLocaleUpperCase() + value.slice(1)
}

function agreement(
  gender: "masculine" | "feminine",
  masculine: string,
  feminine: string
) {
  return gender === "masculine" ? masculine : feminine
}
