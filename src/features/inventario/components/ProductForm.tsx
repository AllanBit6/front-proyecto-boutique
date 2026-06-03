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
  useCreateBrand,
  useCreateProduct,
  useUpdateProduct,
} from "@/features/inventario/hooks/useProducts"
import {
  productSchema,
  type ProductFormValues,
} from "@/features/inventario/schemas/productSchema"
import type {
  CatalogOption,
  Product,
} from "@/features/inventario/types/product"

interface ProductFormProps {
  brands: CatalogOption[]
  product?: Product
  onSuccess?: () => void
}

export function ProductForm({
  brands,
  product,
  onSuccess,
}: ProductFormProps) {
  const createBrand = useCreateBrand()
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: getDefaultValues(product),
  })

  useEffect(() => {
    form.reset(getDefaultValues(product))
  }, [form, product])

  const onSubmit = form.handleSubmit(async (values) => {
    const brandId = await resolveBrandId(values.marca_nombre, brands, (name) =>
      createBrand.mutateAsync({ nombre: name })
    )
    const input = {
      nombre: values.nombre,
      caracteristica_distintiva: values.caracteristica_distintiva,
      marca_id: brandId,
    }

    if (product) {
      await updateProduct.mutateAsync({ id: product.id, input })
    } else {
      await createProduct.mutateAsync(input)
    }

    form.reset(getDefaultValues())
    onSuccess?.()
  })

  const isPending =
    createBrand.isPending || createProduct.isPending || updateProduct.isPending

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.nombre)}>
          <FieldLabel htmlFor="nombre_producto">Nombre</FieldLabel>
          <Input id="nombre_producto" {...form.register("nombre")} />
          <FieldError errors={[form.formState.errors.nombre]} />
        </Field>
        <Field
          data-invalid={Boolean(
            form.formState.errors.caracteristica_distintiva
          )}
        >
          <FieldLabel htmlFor="caracteristica_distintiva">
            Caracteristica
          </FieldLabel>
          <Input
            id="caracteristica_distintiva"
            {...form.register("caracteristica_distintiva")}
          />
          <FieldError
            errors={[form.formState.errors.caracteristica_distintiva]}
          />
        </Field>
        <Field data-invalid={Boolean(form.formState.errors.marca_nombre)}>
          <FieldLabel htmlFor="marca_nombre">Marca</FieldLabel>
          <Input
            id="marca_nombre"
            list="marcas-disponibles"
            placeholder="Escribe o selecciona una marca"
            {...form.register("marca_nombre")}
          />
          <datalist id="marcas-disponibles">
            {brands.map((brand) => (
              <option key={brand.id} value={brand.nombre} />
            ))}
          </datalist>
          <FieldError errors={[form.formState.errors.marca_nombre]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Guardando..."
          : product
            ? "Guardar cambios"
            : "Crear modelo"}
      </Button>
    </form>
  )
}

function getDefaultValues(product?: Product): ProductFormValues {
  return {
    nombre: product?.nombre ?? "",
    caracteristica_distintiva: product?.caracteristica_distintiva ?? "",
    marca_nombre: product?.marca_nombre ?? "",
  }
}

function normalizeBrandName(name: string) {
  return name.trim().toLocaleLowerCase()
}

async function resolveBrandId(
  brandName: string,
  brands: CatalogOption[],
  createBrand: (name: string) => Promise<CatalogOption>
) {
  const normalizedBrandName = normalizeBrandName(brandName)
  const existingBrand = brands.find(
    (brand) => normalizeBrandName(brand.nombre) === normalizedBrandName
  )

  if (existingBrand) {
    return existingBrand.id
  }

  const newBrand = await createBrand(brandName.trim())

  return newBrand.id
}
