import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateVariant,
  useUpdateVariant,
} from "@/features/inventario/hooks/useProducts"
import {
  type VariantFormValues,
  variantSchema,
} from "@/features/inventario/schemas/productSchema"
import type {
  CatalogOption,
  Product,
  Variant,
} from "@/features/inventario/types/product"

interface VariantFormProps {
  products: Product[]
  sizes: CatalogOption[]
  colors: CatalogOption[]
  variant?: Variant
  onSuccess?: () => void
}

export function VariantForm({
  products,
  sizes,
  colors,
  variant,
  onSuccess,
}: VariantFormProps) {
  const createVariant = useCreateVariant()
  const updateVariant = useUpdateVariant()
  const form = useForm<VariantFormValues>({
    resolver: zodResolver(variantSchema),
    defaultValues: getDefaultValues(variant),
  })

  useEffect(() => {
    form.reset(getDefaultValues(variant))
  }, [form, variant])

  const onSubmit = form.handleSubmit(async (values) => {
    const product = products.find((item) => item.id === values.producto_id)
    const size = sizes.find((item) => item.id === values.talla_id)
    const color = colors.find((item) => item.id === values.color_id)
    const input = {
      ...values,
      sku:
        values.sku?.trim() ||
        buildSku(product?.nombre ?? "", size?.nombre ?? "", color?.nombre ?? ""),
    }

    if (variant) {
      await updateVariant.mutateAsync({ id: variant.id, input })
    } else {
      await createVariant.mutateAsync(input)
    }

    form.reset(getDefaultValues())
    onSuccess?.()
  })

  const isPending = createVariant.isPending || updateVariant.isPending
  const hasCatalogs = products.length > 0 && sizes.length > 0 && colors.length > 0

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={Boolean(form.formState.errors.producto_id)}>
          <FieldLabel>Prenda</FieldLabel>
          <Select
            value={form.watch("producto_id")}
            onValueChange={(value) =>
              form.setValue("producto_id", value ?? "", {
                shouldValidate: true,
              })
            }
            disabled={!products.length}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una prenda" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError errors={[form.formState.errors.producto_id]} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.talla_id)}>
            <FieldLabel>Talla</FieldLabel>
            <Select
              value={form.watch("talla_id")}
              onValueChange={(value) =>
                form.setValue("talla_id", value ?? "", {
                  shouldValidate: true,
                })
              }
              disabled={!sizes.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Talla" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[form.formState.errors.talla_id]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.color_id)}>
            <FieldLabel>Color</FieldLabel>
            <Select
              value={form.watch("color_id")}
              onValueChange={(value) =>
                form.setValue("color_id", value ?? "", {
                  shouldValidate: true,
                })
              }
              disabled={!colors.length}
            >
              <SelectTrigger>
                <SelectValue placeholder="Color" />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.id} value={color.id}>
                    {color.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError errors={[form.formState.errors.color_id]} />
          </Field>
        </div>
        <Field data-invalid={Boolean(form.formState.errors.sku)}>
          <FieldLabel htmlFor="sku">SKU</FieldLabel>
          <Input id="sku" placeholder="Automatico" {...form.register("sku")} />
          <FieldError errors={[form.formState.errors.sku]} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.precio_compra)}>
            <FieldLabel htmlFor="precio_compra">Precio compra</FieldLabel>
            <Input
              id="precio_compra"
              type="number"
              min="0"
              step="0.01"
              {...form.register("precio_compra", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.precio_compra]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.precio_venta)}>
            <FieldLabel htmlFor="precio_venta">Precio venta</FieldLabel>
            <Input
              id="precio_venta"
              type="number"
              min="0"
              step="0.01"
              {...form.register("precio_venta", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.precio_venta]} />
          </Field>
        </div>
        <Field data-invalid={Boolean(form.formState.errors.stock_minimo)}>
          <FieldLabel htmlFor="stock_minimo">Alerta stock</FieldLabel>
          <Input
            id="stock_minimo"
            type="number"
            min="0"
            step="1"
            {...form.register("stock_minimo", { valueAsNumber: true })}
          />
          <FieldError errors={[form.formState.errors.stock_minimo]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isPending || !hasCatalogs}>
        {isPending
          ? "Guardando..."
          : variant
            ? "Guardar cambios"
            : "Agregar talla/color"}
      </Button>
    </form>
  )
}

function buildSku(productName: string, sizeName: string, colorName: string) {
  const parts = [productName, sizeName, colorName]
    .map((part) =>
      part
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 3)
        .toUpperCase()
    )
    .filter(Boolean)

  return [...parts, Date.now().toString().slice(-4)].join("-")
}

function getDefaultValues(variant?: Variant): VariantFormValues {
  return {
    producto_id: variant?.producto_id ?? "",
    talla_id: variant?.talla_id ?? "",
    color_id: variant?.color_id ?? "",
    sku: variant?.sku ?? "",
    precio_compra: variant?.precio_compra ?? 0,
    precio_venta: variant?.precio_venta ?? 0,
    stock_minimo: variant?.stock_minimo ?? 0,
  }
}
