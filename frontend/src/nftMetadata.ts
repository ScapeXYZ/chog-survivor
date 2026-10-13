export type SurvivorMetadata = {name?: string; description?: string; image?: string; uri: string; localFixture: boolean}
const maxBytes = 128 * 1024
const timeoutMs = 10_000

function text(value: unknown, max: number) { return typeof value === 'string' && value.length > 0 && value.length <= max ? value : undefined }
function safeImage(value: unknown) {
  if (typeof value !== 'string' || value.length > 2048) return undefined
  if (value.startsWith('ipfs://')) return value
  try { const url = new URL(value); return url.protocol === 'https:' ? url.toString() : undefined } catch { return undefined }
}

export function metadataGateway(uri: string): string | undefined {
  if (uri.startsWith('ipfs://')) {
    const path = uri.slice(7)
    return path && !path.includes('..') ? `https://ipfs.io/ipfs/${path}` : undefined
  }
  try { const url = new URL(uri); return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : undefined } catch { return undefined }
}

export async function readMetadata(uri: string, localFixture: boolean, request: typeof fetch = fetch): Promise<SurvivorMetadata> {
  let payload: string
  if (uri.startsWith('data:application/json,')) {
    if (!localFixture) throw new Error('Inline metadata is not accepted for production collection reads')
    payload = decodeURIComponent(uri.slice('data:application/json,'.length))
  } else {
    const gateway = metadataGateway(uri)
    if (!gateway) throw new Error('Unsupported metadata URI scheme')
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await request(gateway, {signal: controller.signal, headers: {Accept: 'application/json'}})
      if (!response.ok) throw new Error(`Metadata gateway returned ${response.status}`)
      const length = Number(response.headers.get('content-length') ?? 0)
      if (length > maxBytes) throw new Error('Metadata exceeds size limit')
      payload = await response.text(); if (payload.length > maxBytes) throw new Error('Metadata exceeds size limit')
    } finally { clearTimeout(timer) }
  }
  let parsed: unknown
  try { parsed = JSON.parse(payload) } catch { throw new Error('Metadata JSON is malformed') }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Metadata JSON must be an object')
  const value = parsed as Record<string, unknown>
  return {uri, localFixture, name: text(value.name, 120), description: text(value.description, 500), image: safeImage(value.image)}
}
