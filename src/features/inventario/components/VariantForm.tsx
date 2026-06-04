import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"

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
import { buildBarcode, buildSku } from "@/features/inventario/utils/codes"

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

    if (!product || (!product.activo && product.id !== variant?.producto_id)) {
      form.setError("producto_id", {
        message: "Selecciona una prenda activa.",
      })
      return
    }

    const input = {
      ...values,
      sku:
        variant?.sku ||
        buildSku(
          product?.nombre ?? "",
          size?.nombre ?? "",
          color?.nombre ?? ""
        ),
      codigo_barras: variant?.codigo_barras || buildBarcode(),
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
  const selectableProducts = products.filter(
    (product) => product.activo || product.id === variant?.producto_id
  )
  const hasCatalogs =
    selectableProducts.length > 0 && sizes.length > 0 && colors.length > 0
  const selectedProductId = useWatch({
    control: form.control,
    name: "producto_id",
  })
  const selectedSizeId = useWatch({ control: form.control, name: "talla_id" })
  const selectedColorId = useWatch({ control: form.control, name: "color_id" })
  const selectedProduct = selectableProducts.find(
    (item) => item.id === selectedProductId
  )
  const selectedSize = sizes.find((item) => item.id === selectedSizeId)
  const selectedColor = colors.find((item) => item.id === selectedColorId)

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={Boolean(form.formState.errors.producto_id)}>
          <FieldLabel>Prenda</FieldLabel>
          <Select
            value={selectedProductId}
            onValueChange={(value) =>
              form.setValue("producto_id", value ?? "", {
                shouldValidate: true,
              })
            }
            disabled={!selectableProducts.length}
          >
            <SelectTrigger>
              <span className={!selectedProduct ? "text-muted-foreground" : ""}>
                {selectedProduct?.nombre ?? "Selecciona una prenda"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {selectableProducts.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.nombre}
                  {!product.activo ? " (desactivada)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!selectableProducts.length ? (
            <div className="text-xs text-destructive">
              No hay prendas activas disponibles.
            </div>
          ) : null}
          <FieldError errors={[form.formState.errors.producto_id]} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.talla_id)}>
            <FieldLabel>Talla</FieldLabel>
            <Select
              value={selectedSizeId}
              onValueChange={(value) =>
                form.setValue("talla_id", value ?? "", {
                  shouldValidate: true,
                })
              }
              disabled={!sizes.length}
            >
              <SelectTrigger>
                <span className={!selectedSize ? "text-muted-foreground" : ""}>
                  {selectedSize?.nombre ?? "Talla"}
                </span>
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
              value={selectedColorId}
              onValueChange={(value) =>
                form.setValue("color_id", value ?? "", {
                  shouldValidate: true,
                })
              }
              disabled={!colors.length}
            >
              <SelectTrigger>
                <span className={!selectedColor ? "text-muted-foreground" : ""}>
                  {selectedColor?.nombre ?? "Color"}
                </span>
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.precio_compra)}>
            <FieldLabel htmlFor="precio_compra">Costo</FieldLabel>
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
            <FieldLabel htmlFor="precio_venta">Precio de venta</FieldLabel>
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
          <FieldLabel htmlFor="stock_minimo">Avisar cuando queden</FieldLabel>
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
            : "Guardar talla/color"}
      </Button>
    </form>
  )
}

function getDefaultValues(variant?: Variant): VariantFormValues {
  return {
    producto_id: variant?.producto_id ?? "",
    talla_id: variant?.talla_id ?? "",
    color_id: variant?.color_id ?? "",
    precio_compra: variant?.precio_compra ?? 0,
    precio_venta: variant?.precio_venta ?? 0,
    stock_minimo: variant?.stock_minimo ?? 0,
  }
}
