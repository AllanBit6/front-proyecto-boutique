const CONTROL_CHARS = new RegExp(
  String.raw`[\u0000-\u001f\u007f-\u009f]`,
  "g"
)
const BIDI_CONTROLS = /[\u202a-\u202e\u2066-\u2069]/g
const HTML_LIKE = /<[^>]*>/
const TECHNICAL_ERROR_MARKERS =
  /(?:traceback|stack trace|syntaxerror|typeerror|referenceerror|internal server error|<!doctype|\{|\})/i

interface TextOptions {
  maxLength?: number
  uppercase?: boolean
  lowercase?: boolean
}

export function normalizeTextInput(value: unknown, options: TextOptions = {}) {
  const config = options
  let text = String(value ?? "")
    .normalize("NFC")
    .replace(CONTROL_CHARS, "")
    .replace(BIDI_CONTROLS, "")
    .replace(/\s+/g, " ")
    .trim()

  if (config.uppercase) {
    text = text.toLocaleUpperCase()
  }

  if (config.lowercase) {
    text = text.toLocaleLowerCase()
  }

  return config.maxLength ? text.slice(0, config.maxLength) : text
}

export function normalizeCodeInput(value: unknown, maxLength = 64) {
  return normalizeTextInput(value, { maxLength, uppercase: true }).replace(
    /[^A-Z0-9._-]/g,
    ""
  )
}

export function normalizeUsername(value: unknown) {
  return normalizeTextInput(value, { maxLength: 40, lowercase: true }).replace(
    /[^a-z0-9._-]/g,
    ""
  )
}

export function finiteNumber(value: unknown, fallback = 0) {
  const number = Number(value)

  return Number.isFinite(number) ? number : fallback
}

export function positiveInteger(value: unknown, fallback = 0) {
  return Math.max(0, Math.trunc(finiteNumber(value, fallback)))
}

export function moneyValue(value: unknown, fallback = 0) {
  const number = finiteNumber(value, fallback)

  return Math.round(Math.max(0, number) * 100) / 100
}

export function safeErrorMessage(message: unknown, fallback: string) {
  const text = normalizeTextInput(message, { maxLength: 180 })

  if (!text || HTML_LIKE.test(text) || TECHNICAL_ERROR_MARKERS.test(text)) {
    return fallback
  }

  return text
}
