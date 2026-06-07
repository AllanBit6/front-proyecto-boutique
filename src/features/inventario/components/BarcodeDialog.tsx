import { Download } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useUpdateVariant } from "@/features/inventario/hooks/useProducts"
import type { Variant } from "@/features/inventario/types/product"
import { buildBarcode, buildSku } from "@/features/inventario/utils/codes"

interface BarcodeDialogProps {
  variant: Variant | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BarcodeDialog({
  variant,
  open,
  onOpenChange,
}: BarcodeDialogProps) {
  const [generatedBarcode, setGeneratedBarcode] = useState<{
    variantId: string
    value: string
  } | null>(null)
  const updateVariant = useUpdateVariant()
  const generatedBarcodeValue =
    generatedBarcode && generatedBarcode.variantId === variant?.id
      ? generatedBarcode.value
      : ""
  const barcode = generatedBarcodeValue || variant?.codigo_barras
  const sku =
    variant?.sku ||
    (variant
      ? buildSku(
          variant.producto_nombre,
          variant.talla_nombre,
          variant.color_nombre
        )
      : "")
  const barcodeSvg = useMemo(
    () => (barcode ? createEan13Svg(barcode, sku) : ""),
    [barcode, sku]
  )
  const barcodeSvgUrl = useMemo(
    () =>
      barcodeSvg
        ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(barcodeSvg)}`
        : "",
    [barcodeSvg]
  )

  function handleDownload() {
    if (!barcodeSvg || !barcode) {
      return
    }

    const blob = new Blob([barcodeSvg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `barcode-${barcode}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleCreateBarcode() {
    if (!variant) {
      return
    }

    const nextBarcode = buildBarcode()
    const promise = updateVariant.mutateAsync({
      id: variant.id,
      input: {
        producto_id: variant.producto_id,
        talla_id: variant.talla_id,
        color_id: variant.color_id,
        sku:
          variant.sku ||
          buildSku(
            variant.producto_nombre,
            variant.talla_nombre,
            variant.color_nombre
          ),
        codigo_barras: nextBarcode,
        precio_compra: variant.precio_compra,
        precio_venta: variant.precio_venta,
        stock_minimo: variant.stock_minimo,
        activo: variant.activo,
      },
    })

    toast.promise(promise, {
      loading: "Generando código de barras...",
      success: "Codigo de barras listo.",
      error: (error) =>
        error instanceof Error
          ? error.message
          : "No se pudo generar el código.",
    })

    try {
      const updatedVariant = await promise
      setGeneratedBarcode({
        variantId: variant.id,
        value: updatedVariant.codigo_barras || nextBarcode,
      })
    } catch {
      // toast.promise displays the error.
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Codigo de barras</DialogTitle>
          <DialogDescription>
            {variant?.producto_nombre} / {variant?.talla_nombre} /{" "}
            {variant?.color_nombre}
          </DialogDescription>
        </DialogHeader>
        {barcodeSvg ? (
          <div className="overflow-x-auto rounded-lg border bg-white p-4">
            <img
              alt={`Codigo de barras ${barcode}`}
              className="mx-auto w-fit"
              src={barcodeSvgUrl}
            />
          </div>
        ) : barcode ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Este código no se puede imprimir como EAN-13. Genera uno nuevo para
            esta prenda.
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Esta prenda aún no tiene código de barras.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          {barcodeSvg ? (
            <Button onClick={handleDownload}>
              <Download />
              Descargar SVG
            </Button>
          ) : (
            <Button
              disabled={updateVariant.isPending}
              onClick={handleCreateBarcode}
            >
              {updateVariant.isPending
                ? "Creando..."
                : barcode
                  ? "Generar nuevo código"
                  : "Crear código"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const LEFT_ODD = [
  "0001101",
  "0011001",
  "0010011",
  "0111101",
  "0100011",
  "0110001",
  "0101111",
  "0111011",
  "0110111",
  "0001011",
]
const LEFT_EVEN = [
  "0100111",
  "0110011",
  "0011011",
  "0100001",
  "0011101",
  "0111001",
  "0000101",
  "0010001",
  "0001001",
  "0010111",
]
const RIGHT = [
  "1110010",
  "1100110",
  "1101100",
  "1000010",
  "1011100",
  "1001110",
  "1010000",
  "1000100",
  "1001000",
  "1110100",
]
const PARITY = [
  "LLLLLL",
  "LLGLGG",
  "LLGGLG",
  "LLGGGL",
  "LGLLGG",
  "LGGLLG",
  "LGGGLL",
  "LGLGLG",
  "LGLGGL",
  "LGGLGL",
]

function createEan13Svg(value: string, sku: string) {
  if (!/^\d{13}$/.test(value)) {
    return ""
  }

  const digits = value.split("").map(Number)
  const leftPattern = PARITY[digits[0]]
  const leftBits = digits
    .slice(1, 7)
    .map((digit, index) =>
      leftPattern[index] === "L" ? LEFT_ODD[digit] : LEFT_EVEN[digit]
    )
    .join("")
  const rightBits = digits
    .slice(7)
    .map((digit) => RIGHT[digit])
    .join("")
  const bits = `101${leftBits}01010${rightBits}101`
  const moduleWidth = 2
  const quiet = 18
  const barHeight = 72
  const guardHeight = 82
  const topPadding = sku ? 26 : 0
  const barTop = 10 + topPadding
  const textY = 108 + topPadding
  const width = quiet * 2 + bits.length * moduleWidth
  const height = 118 + topPadding
  const bars = bits
    .split("")
    .map((bit, index) => {
      if (bit !== "1") {
        return ""
      }

      const isGuard =
        index < 3 || (index >= 45 && index < 50) || index >= bits.length - 3
      const height = isGuard ? guardHeight : barHeight
      const x = quiet + index * moduleWidth

      return `<rect x="${x}" y="${barTop}" width="${moduleWidth}" height="${height}" fill="#111827" />`
    })
    .join("")

  const skuText = sku
    ? `<text x="${width / 2}" y="18" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700" fill="#111827" text-anchor="middle">${escapeSvgText(sku)}</text>`
    : ""

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="Codigo de barras ${value}">
  <rect width="100%" height="100%" fill="#ffffff" />
  ${skuText}
  ${bars}
  <text x="${quiet - 8}" y="${textY}" font-family="Inter, Arial, sans-serif" font-size="13" fill="#111827" text-anchor="middle">${value[0]}</text>
  <text x="${quiet + 24 * moduleWidth}" y="${textY}" font-family="Inter, Arial, sans-serif" font-size="13" fill="#111827" text-anchor="middle">${value.slice(1, 7)}</text>
  <text x="${quiet + 72 * moduleWidth}" y="${textY}" font-family="Inter, Arial, sans-serif" font-size="13" fill="#111827" text-anchor="middle">${value.slice(7)}</text>
</svg>`
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
