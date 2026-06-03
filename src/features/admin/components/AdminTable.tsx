import { Button } from "@/components/ui/button"

interface AdminPagerProps {
  page: number
  totalPages: number
  total: number
  disabled?: boolean
  onPrevious: () => void
  onNext: () => void
}

export function AdminPager({
  page,
  totalPages,
  total,
  disabled,
  onPrevious,
  onNext,
}: AdminPagerProps) {
  return (
    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        {total} registros - Pagina {page} de {totalPages}
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page <= 1}
          onClick={onPrevious}
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || page >= totalPages}
          onClick={onNext}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}

export function formatCurrency(value: number) {
  return `Q ${value.toFixed(2)}`
}

export function formatDate(value?: string) {
  if (!value) {
    return "-"
  }

  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}
