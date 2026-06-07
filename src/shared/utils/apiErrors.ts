import { safeErrorMessage } from "@/shared/utils/security"

export async function readSafeApiError(
  response: Response,
  fallback = "No se pudo completar la solicitud."
) {
  const text = await response.text()

  if (!text) {
    return fallback
  }

  try {
    const data = JSON.parse(text) as Record<string, unknown>
    const message = data.message ?? data.error ?? data.detail

    if (Array.isArray(message)) {
      return safeErrorMessage(message.join(", "), fallback)
    }

    return safeErrorMessage(message ?? text, fallback)
  } catch {
    return safeErrorMessage(text, fallback)
  }
}
