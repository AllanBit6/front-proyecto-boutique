import { CalendarDays, CreditCard, Receipt, TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ChartSkeleton,
  LoadTransition,
} from "@/components/ui/loading-skeletons"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboard } from "@/features/admin/hooks/useAdmin"
import { formatCurrency } from "@/features/admin/utils/formatters"

const salesChartConfig = {
  total: {
    label: "Ventas",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

const productChartConfig = {
  cantidad: {
    label: "Unidades",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

const PRODUCT_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--primary)",
]

export function DashboardPage() {
  const dashboardQuery = useDashboard()
  const metrics = dashboardQuery.data
  const isLoading = dashboardQuery.isLoading
  const weeklySales = metrics?.ventasSemanales ?? []
  const monthlySales = metrics?.ventasMes ?? metrics?.ventasAnio ?? []
  const topProducts = normalizeTopProducts(
    metrics?.topProducts ?? metrics?.topVariantes ?? []
  ).slice(0, 6)
  const cards = [
    {
      title: "Caja de hoy",
      value: isLoading
        ? "..."
        : formatCurrency(Number(metrics?.ingresosHoy ?? 0)),
      icon: TrendingUp,
    },
    {
      title: "Ventas de hoy",
      value: isLoading ? "..." : Number(metrics?.ventasHoy ?? 0),
      icon: Receipt,
    },
    {
      title: "Ingresos del mes",
      value: isLoading
        ? "..."
        : formatCurrency(Number(metrics?.ingresosMes ?? 0)),
      icon: CalendarDays,
    },
    {
      title: "Ticket promedio",
      value: isLoading
        ? "..."
        : formatCurrency(
            Number(metrics?.ticketProm ?? metrics?.ticketPromedio ?? 0)
          ),
      icon: CreditCard,
    },
  ]

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Resumen de tienda</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((item) => {
          const Icon = item.icon

          return (
            <Card key={item.title}>
              <CardHeader className="flex-row items-center justify-between gap-3">
                <CardTitle className="text-sm text-muted-foreground">
                  {item.title}
                </CardTitle>
                <div className="icon-surface size-8 bg-accent text-accent-foreground">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {isLoading ? (
                  <Skeleton className="h-8 w-28" />
                ) : (
                  <LoadTransition>{item.value}</LoadTransition>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {dashboardQuery.isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          No se pudieron cargar las métricas del resumen.
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Ventas del mes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton height={260} />
            ) : monthlySales.length ? (
              <LoadTransition>
                <ChartContainer
                  className="aspect-auto h-[260px] w-full"
                  config={salesChartConfig}
                >
                  <AreaChart
                    accessibilityLayer
                    data={monthlySales}
                    margin={{ left: 0, right: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="mes"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                    />
                    <YAxis hide />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Area
                      dataKey="total"
                      type="natural"
                      fill="var(--color-total)"
                      fillOpacity={0.18}
                      stroke="var(--color-total)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </LoadTransition>
            ) : (
              <EmptyChart message="Sin datos." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mas vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ChartSkeleton height={220} />
            ) : topProducts.length ? (
              <LoadTransition>
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-1">
                  <ChartContainer
                    className="aspect-auto h-[220px] w-full"
                    config={productChartConfig}
                  >
                    <PieChart accessibilityLayer>
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            hideLabel
                            nameKey="nombre"
                            formatter={(value, name) => (
                              <div className="flex min-w-32 items-center justify-between gap-3">
                                <span className="text-muted-foreground">
                                  {name}
                                </span>
                                <span className="font-mono font-medium tabular-nums">
                                  {Number(value).toLocaleString()}
                                </span>
                              </div>
                            )}
                          />
                        }
                      />
                      <Pie
                        data={topProducts}
                        dataKey="cantidad"
                        nameKey="nombre"
                        innerRadius={48}
                        outerRadius={82}
                        paddingAngle={2}
                      >
                        {topProducts.map((item, index) => (
                          <Cell
                            key={item.nombre}
                            fill={PRODUCT_COLORS[index % PRODUCT_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ChartContainer>
                  <div className="space-y-2">
                    {topProducts.map((item, index) => (
                      <div
                        key={item.nombre}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="size-2.5 shrink-0 rounded-sm"
                            style={{
                              backgroundColor:
                                PRODUCT_COLORS[index % PRODUCT_COLORS.length],
                            }}
                          />
                          <span className="truncate">{item.nombre}</span>
                        </div>
                        <span className="font-mono text-xs tabular-nums">
                          {item.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </LoadTransition>
            ) : (
              <EmptyChart message="Sin datos." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas esta semana</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ChartSkeleton height={280} />
          ) : weeklySales.length ? (
            <LoadTransition>
              <ChartContainer
                className="aspect-auto h-[280px] w-full"
                config={salesChartConfig}
              >
                <BarChart
                  accessibilityLayer
                  data={weeklySales}
                  margin={{ left: 0, right: 12 }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                  />
                  <YAxis hide />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar dataKey="total" fill="var(--color-total)" radius={4} />
                </BarChart>
              </ChartContainer>
            </LoadTransition>
          ) : (
            <EmptyChart message="Sin datos." />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function normalizeTopProducts(items: Array<Record<string, unknown>>) {
  return items
    .map((item, index) => {
      const variant = readRecord(item.variante)
      const product = readRecord(item.producto)
      const nestedProduct = readRecord(variant?.producto)
      const size = readRecord(variant?.talla)
      const color = readRecord(variant?.color)
      const productName =
        readText(
          item.nombre,
          item.name,
          item.producto_nombre,
          item.nombre_producto,
          item.productName,
          item.nombreProducto,
          item.prenda,
          item.prenda_nombre,
          item.descripcion,
          item.articulo,
          item.modelo,
          product?.nombre,
          nestedProduct?.nombre,
          variant?.producto_nombre,
          variant?.nombre,
          variant?.sku,
          item.producto
        ) ?? `Producto ${index + 1}`
      const variantDetail = [
        readText(item.talla, item.talla_nombre, size?.nombre),
        readText(item.color, item.color_nombre, color?.nombre),
      ]
        .filter(Boolean)
        .join(" / ")
      const name = variantDetail
        ? `${productName} / ${variantDetail}`
        : productName
      const quantity = Number(
        item.cantidad ??
          item.cantidad_vendida ??
          item.cantidadVendida ??
          item.total ??
          item.total_vendido ??
          item.totalVendido ??
          item.unidades ??
          item.unidades_vendidas ??
          item.unidadesVendidas ??
          item.vendidos ??
          (item._sum as Record<string, unknown> | undefined)?.cantidad ??
          (item._count as Record<string, unknown> | undefined)?.cantidad ??
          0
      )

      return {
        nombre: name,
        cantidad: quantity,
      }
    })
    .filter((item) => item.nombre && item.cantidad > 0)
}

function readRecord(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined
}

function readText(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      const text = value.trim()

      if (isGenericProductLabel(text)) {
        continue
      }

      return text
    }

    if (typeof value === "number") {
      return String(value)
    }
  }

  return undefined
}

function isGenericProductLabel(value: string) {
  return ["producto", "productos", "product", "products"].includes(
    value.toLocaleLowerCase()
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  )
}
