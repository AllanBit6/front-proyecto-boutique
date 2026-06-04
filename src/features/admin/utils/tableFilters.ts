export function normalizeFilter(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase()
}

export function matchesTextSearch(search: string, values: unknown[]) {
  const terms = normalizeFilter(search).split(" ").filter(Boolean)

  if (!terms.length) {
    return true
  }

  const text = normalizeFilter(values.join(" "))

  return terms.every((term) => text.includes(term))
}

export function matchesDateRange(
  value: string | undefined,
  from: string,
  to: string
) {
  if (!from && !to) {
    return true
  }

  if (!value) {
    return false
  }

  const timestamp = new Date(value).getTime()

  if (Number.isNaN(timestamp)) {
    return false
  }

  if (from) {
    const fromTimestamp = new Date(`${from}T00:00:00`).getTime()

    if (timestamp < fromTimestamp) {
      return false
    }
  }

  if (to) {
    const toTimestamp = new Date(`${to}T23:59:59.999`).getTime()

    if (timestamp > toTimestamp) {
      return false
    }
  }

  return true
}
