import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function LoadTransition({ children }: { children: React.ReactNode }) {
  return <div className="content-enter">{children}</div>
}

function TableSkeleton({
  columns = 5,
  rows = 6,
}: {
  columns?: number
  rows?: number
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <TableHead key={columnIndex}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <TableCell key={columnIndex}>
                  <Skeleton
                    className={
                      columnIndex === 0
                        ? "h-5 w-28"
                        : columnIndex === columns - 1
                          ? "h-8 w-16"
                          : "h-5 w-full max-w-32"
                    }
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-full" />
    </div>
  )
}

function DetailSkeleton({ items = 4 }: { items?: number }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-24" />
          </div>
        ))}
      </div>
      <TableSkeleton columns={4} rows={3} />
    </div>
  )
}

function ChartSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div
      className="grid place-items-center rounded-md border border-dashed p-4"
      style={{ minHeight: height }}
    >
      <div className="flex w-full max-w-md items-end justify-center gap-3">
        {[48, 82, 64, 116, 92, 140, 72].map((barHeight, index) => (
          <Skeleton
            key={index}
            className="w-full max-w-10 rounded-sm"
            style={{ height: barHeight }}
          />
        ))}
      </div>
    </div>
  )
}

export {
  ChartSkeleton,
  DetailSkeleton,
  FormSkeleton,
  LoadTransition,
  TableSkeleton,
}
