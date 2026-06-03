import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
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
  useCreateBrand,
  useCreateProduct,
  useCreateVariant,
} from "@/features/inventario/hooks/useProducts"
import type { CatalogOption } from "@/features/inventario/types/product"

const productWizardSchema = z.object({
  nombre: z.string().min(2, "Ingresa al menos 2 caracteres"),
  marca_nombre: z.string().min(2, "Ingresa o selecciona una marca"),
  caracteristica_distintiva: z.string().optional(),
  talla_id: z.string().min(1, "Selecciona una talla"),
  color_id: z.string().min(1, "Selecciona un color"),
  precio_venta: z.number().min(0.01, "Ingresa un precio de venta"),
  precio_compra: z.number().min(0, "Ingresa un precio valido").optional(),
  stock_minimo: z.number().int().min(0, "Ingresa un stock valido").optional(),
  sku: z.string().optional(),
})

type ProductWizardValues = z.infer<typeof productWizardSchema>

interface ProductWizardFormProps {
  brands: CatalogOption[]
  sizes: CatalogOption[]
  colors: CatalogOption[]
  onSuccess?: () => void
}

export function ProductWizardForm({
  brands,
  sizes,
  colors,
  onSuccess,
}: ProductWizardFormProps) {
  const createBrand = useCreateBrand()
  const createProduct = useCreateProduct()
  const createVariant = useCreateVariant()
  const form = useForm<ProductWizardValues>({
    resolver: zodResolver(productWizardSchema),
    defaultValues: {
      nombre: "",
      marca_nombre: "",
      caracteristica_distintiva: "",
      talla_id: "",
      color_id: "",
      precio_venta: 0,
      precio_compra: 0,
      stock_minimo: 1,
      sku: "",
    },
  })
  const isPending =
    createBrand.isPending || createProduct.isPending || createVariant.isPending
  const hasCatalogs = sizes.length > 0 && colors.length > 0

  const onSubmit = form.handleSubmit(async (values) => {
    const brandId = await resolveBrandId(values.marca_nombre, brands, (name) =>
      createBrand.mutateAsync({ nombre: name })
    )
    const product = await createProduct.mutateAsync({
      nombre: values.nombre.trim(),
      caracteristica_distintiva:
        values.caracteristica_distintiva?.trim() || "General",
      marca_id: brandId,
    })
    const size = sizes.find((item) => item.id === values.talla_id)
    const color = colors.find((item) => item.id === values.color_id)

    await createVariant.mutateAsync({
      producto_id: product.id,
      talla_id: values.talla_id,
      color_id: values.color_id,
      sku:
        values.sku?.trim() ||
        buildSku(values.nombre, size?.nombre ?? "", color?.nombre ?? ""),
      precio_compra: values.precio_compra ?? 0,
      precio_venta: values.precio_venta,
      stock_minimo: values.stock_minimo ?? 1,
    })

    form.reset()
    onSuccess?.()
  })

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FieldGroup className="gap-3">
        <Field data-invalid={Boolean(form.formState.errors.nombre)}>
          <FieldLabel htmlFor="wizard_nombre">Prenda</FieldLabel>
          <Input
            id="wizard_nombre"
            placeholder="Vestido floral, blusa satinada..."
            {...form.register("nombre")}
          />
          <FieldError errors={[form.formState.errors.nombre]} />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.marca_nombre)}>
          <FieldLabel htmlFor="wizard_marca">Marca</FieldLabel>
          <Input
            id="wizard_marca"
            list="wizard-marcas"
            placeholder="Escribe o selecciona una marca"
            {...form.register("marca_nombre")}
          />
          <datalist id="wizard-marcas">
            {brands.map((brand) => (
              <option key={brand.id} value={brand.nombre} />
            ))}
          </datalist>
          <FieldError errors={[form.formState.errors.marca_nombre]} />
        </Field>
        <Field
          data-invalid={Boolean(
            form.formState.errors.caracteristica_distintiva
          )}
        >
          <FieldLabel htmlFor="wizard_caracteristica">Detalle</FieldLabel>
          <Input
            id="wizard_caracteristica"
            placeholder="General"
            {...form.register("caracteristica_distintiva")}
          />
          <FieldDescription>Opcional.</FieldDescription>
          <FieldError
            errors={[form.formState.errors.caracteristica_distintiva]}
          />
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
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.precio_venta)}>
            <FieldLabel htmlFor="wizard_precio_venta">
              Precio de venta
            </FieldLabel>
            <Input
              id="wizard_precio_venta"
              type="number"
              min="0"
              step="0.01"
              {...form.register("precio_venta", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.precio_venta]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.precio_compra)}>
            <FieldLabel htmlFor="wizard_precio_compra">Costo</FieldLabel>
            <Input
              id="wizard_precio_compra"
              type="number"
              min="0"
              step="0.01"
              {...form.register("precio_compra", { valueAsNumber: true })}
            />
            <FieldError errors={[form.formState.errors.precio_compra]} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field data-invalid={Boolean(form.formState.errors.stock_minimo)}>
            <FieldLabel htmlFor="wizard_stock_minimo">
              Avisar cuando queden
            </FieldLabel>
            <Input
              id="wizard_stock_minimo"
              type="number"
              min="0"
              step="1"
              {...form.register("stock_minimo", { valueAsNumber: true })}
            />
            <FieldDescription>Opcional.</FieldDescription>
            <FieldError errors={[form.formState.errors.stock_minimo]} />
          </Field>
          <Field data-invalid={Boolean(form.formState.errors.sku)}>
            <FieldLabel htmlFor="wizard_sku">Codigo interno</FieldLabel>
            <Input
              id="wizard_sku"
              placeholder="Automatico"
              {...form.register("sku")}
            />
            <FieldDescription>Opcional.</FieldDescription>
            <FieldError errors={[form.formState.errors.sku]} />
          </Field>
        </div>
      </FieldGroup>
      <Button type="submit" disabled={isPending || !hasCatalogs}>
        {isPending ? "Registrando..." : "Registrar prenda"}
      </Button>
    </form>
  )
}

function normalizeName(name: string) {
  return name.trim().toLocaleLowerCase()
}

async function resolveBrandId(
  brandName: string,
  brands: CatalogOption[],
  createBrand: (name: string) => Promise<CatalogOption>
) {
  const normalizedBrandName = normalizeName(brandName)
  const existingBrand = brands.find(
    (brand) => normalizeName(brand.nombre) === normalizedBrandName
  )

  if (existingBrand) {
    return existingBrand.id
  }

  const newBrand = await createBrand(brandName.trim())

  return newBrand.id
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
