import { CalendarDays, CreditCard, Receipt, TrendingUp } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
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
import { useDashboard } from "@/features/admin/hooks/useAdmin"
import { formatCurrency } from "@/features/admin/components/AdminTable"

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

export function DashboardPage() {
  const dashboardQuery = useDashboard()
  const metrics = dashboardQuery.data
  const weeklySales = metrics?.ventasSemanales ?? []
  const monthlySales = metrics?.ventasMes ?? metrics?.ventasAnio ?? []
  const topProducts = metrics?.topProducts ?? metrics?.topVariantes ?? []
  const cards = [
    {
      title: "Ingresos de hoy",
      value: formatCurrency(Number(metrics?.ingresosHoy ?? 0)),
      icon: TrendingUp,
    },
    {
      title: "Ventas realizadas",
      value: Number(metrics?.ventasHoy ?? 0),
      icon: Receipt,
    },
    {
      title: "Ingresos del mes",
      value: formatCurrency(Number(metrics?.ingresosMes ?? 0)),
      icon: CalendarDays,
    },
    {
      title: "Ticket promedio",
      value: formatCurrency(
        Number(metrics?.ticketProm ?? metrics?.ticketPromedio ?? 0)
      ),
      icon: CreditCard,
    },
  ]

  return (
    <section className="space-y-4">
      <div>
        <h1 className="page-heading">Resumen de tienda</h1>
        <p className="page-subtitle">
          Indicadores rápidos para revisar ventas, ingresos y comportamiento del
          mostrador.
        </p>
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
                <div className="flex size-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent className="text-2xl font-semibold tabular-nums">
                {item.value}
              </CardContent>
            </Card>
          )
        })}
      </div>
      {dashboardQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">
          Cargando metricas...
        </div>
      ) : null}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <CardTitle>Ventas semanales</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklySales.length ? (
              <ChartContainer
                className="aspect-auto h-[260px] w-full"
                config={salesChartConfig}
              >
                <AreaChart
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
            ) : (
              <EmptyChart message="Sin datos semanales disponibles." />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productos mas vendidos</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length ? (
              <ChartContainer
                className="aspect-auto h-[260px] w-full"
                config={productChartConfig}
              >
                <BarChart
                  accessibilityLayer
                  data={topProducts.slice(0, 6)}
                  layout="vertical"
                  margin={{ left: 8, right: 12 }}
                >
                  <CartesianGrid horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="nombre"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={120}
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Bar
                    dataKey="cantidad"
                    fill="var(--color-cantidad)"
                    radius={4}
                  />
                </BarChart>
              </ChartContainer>
            ) : (
              <EmptyChart message="Sin productos vendidos para mostrar." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ventas del mes</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlySales.length ? (
            <ChartContainer
              className="aspect-auto h-[280px] w-full"
              config={salesChartConfig}
            >
              <BarChart
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
                <Bar dataKey="total" fill="var(--color-total)" radius={4} />
              </BarChart>
            </ChartContainer>
          ) : (
            <EmptyChart message="Sin ventas mensuales disponibles." />
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="grid h-[220px] place-items-center rounded-md border border-dashed text-sm text-muted-foreground">
      {message}
    </div>
  )
}
