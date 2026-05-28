import type { PreviewModel } from "./types"

export async function fetchModel(): Promise<PreviewModel> {
  return fetchJSON<PreviewModel>("/api/model", { cache: "no-store" })
}

export async function switchTarget(path: string): Promise<PreviewModel> {
  return fetchJSON<PreviewModel>("/api/target", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  })
}

export async function pickTarget(): Promise<PreviewModel> {
  return fetchJSON<PreviewModel>("/api/pick-target", { method: "POST" })
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init)
  const body = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = typeof body.message === "string" ? body.message : `Preview request failed: ${response.status}`
    throw Object.assign(new Error(message), { body })
  }
  return body as T
}
