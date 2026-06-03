function cleanPart(value: string, length = 3) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, length)
    .toUpperCase()
}

export function buildSku(
  productName: string,
  sizeName: string,
  colorName: string
) {
  const parts = [productName, sizeName, colorName]
    .map((part) => cleanPart(part))
    .filter(Boolean)

  return [...parts, Date.now().toString().slice(-4)].join("-")
}

export function buildBarcode() {
  const base = `${Date.now().toString().slice(-10)}${Math.floor(
    Math.random() * 100
  )
    .toString()
    .padStart(2, "0")}`

  return `${base}${getEan13CheckDigit(base)}`
}

function getEan13CheckDigit(value: string) {
  const sum = value
    .padStart(12, "0")
    .slice(0, 12)
    .split("")
    .reduce((total, digit, index) => {
      const number = Number(digit)

      return total + number * (index % 2 === 0 ? 1 : 3)
    }, 0)

  return String((10 - (sum % 10)) % 10)
}
