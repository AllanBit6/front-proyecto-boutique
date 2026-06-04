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
