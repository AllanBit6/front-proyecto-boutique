const API_BASE_PATH = "/api/v1"
const API_TARGET = import.meta.env.VITE_API_TARGET ?? ""

function trimTrailingSlashes(value: string) {
  return value.replace(/\/+$/, "")
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`
}

function apiBaseUrl() {
  const target = trimTrailingSlashes(API_TARGET)

  if (!target) {
    return API_BASE_PATH
  }

  if (target.endsWith(API_BASE_PATH)) {
    return target
  }

  return `${target}${API_BASE_PATH}`
}

export function apiUrl(path: string) {
  return `${apiBaseUrl()}${normalizePath(path)}`
}
