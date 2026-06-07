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
        {total} registros - Página {page} de {Math.max(totalPages, 1)}
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
          disabled={disabled || page >= Math.max(totalPages, 1)}
          onClick={onNext}
        >
          Siguiente
        </Button>
      </div>
    </div>
  )
}
