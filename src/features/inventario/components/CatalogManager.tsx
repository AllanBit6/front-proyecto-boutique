import { Plus, Trash2 } from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useCreateColor,
  useCreateSize,
  useDeleteColor,
  useDeleteSize,
} from "@/features/inventario/hooks/useProducts"
import type { CatalogOption } from "@/features/inventario/types/product"

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
          placeholder="Nueva talla"
          emptyText="No hay tallas activas."
          useCreate={useCreateSize}
          useDelete={useDeleteSize}
        />
      </TabsContent>
      <TabsContent value="colors" className="mt-3">
        <CatalogList
          items={colors}
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
  placeholder,
  emptyText,
  useCreate,
  useDelete,
}: {
  items: CatalogOption[]
  placeholder: string
  emptyText: string
  useCreate: typeof useCreateSize
  useDelete: typeof useDeleteSize
}) {
  const [name, setName] = useState("")
  const createItem = useCreate()
  const deleteItem = useDelete()
  const isPending = createItem.isPending || deleteItem.isPending

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = name.trim()

    if (!trimmedName) {
      return
    }

    await createItem.mutateAsync({ nombre: trimmedName })
    setName("")
  }

  return (
    <div className="space-y-3">
      <form className="flex gap-2" onSubmit={handleSubmit}>
        <Input
          value={name}
          placeholder={placeholder}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit" size="icon" disabled={isPending || !name.trim()}>
          <Plus />
        </Button>
      </form>
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
                onClick={() => deleteItem.mutate(item.id)}
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
    </div>
  )
}
