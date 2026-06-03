import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DashboardPage() {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Ventas del dia</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">$1,240.00</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tickets</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">38</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stock bajo</CardTitle>
        </CardHeader>
        <CardContent className="text-2xl font-semibold">7</CardContent>
      </Card>
    </section>
  )
}
