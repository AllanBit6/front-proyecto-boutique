import JsBarcode from "jsbarcode"
import { Download } from "lucide-react"
import { useEffect, useRef } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Variant } from "@/features/inventario/types/product"

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
  const barcodeRef = useRef<SVGSVGElement | null>(null)
  const barcode = variant?.codigo_barras

  useEffect(() => {
    if (!barcodeRef.current || !barcode) {
      return
    }

    JsBarcode(barcodeRef.current, barcode, {
      format: "CODE128",
      displayValue: true,
      font: "Inter, Arial, sans-serif",
      fontSize: 14,
      height: 72,
      margin: 12,
      width: 2,
    })
  }, [barcode, open])

  function handleDownload() {
    if (!barcodeRef.current || !variant) {
      return
    }

    const serializer = new XMLSerializer()
    const svg = serializer.serializeToString(barcodeRef.current)
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `barcode-${variant.sku}.svg`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Codigo de barras</DialogTitle>
          <DialogDescription>
            {variant?.sku} - {variant?.producto_nombre}
          </DialogDescription>
        </DialogHeader>
        {barcode ? (
          <div className="overflow-x-auto rounded-lg border bg-white p-4">
            <svg ref={barcodeRef} className="mx-auto block" />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Esta presentacion aun no tiene codigo de barras.
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button disabled={!barcode} onClick={handleDownload}>
            <Download />
            Descargar SVG
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
