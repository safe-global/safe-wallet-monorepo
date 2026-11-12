import { getOriginPath } from './url'

type NativeChannel = 'NATIVE_TRANSFER' | 'NATIVE_BATCH'
type AppChannel = 'SAFE_APP' | 'WIDGET' | 'WALLET_CONNECT'

export type DeclaredChannel = NativeChannel | AppChannel

export type DeclaredAttribution = {
  channel: DeclaredChannel
  appName?: string
  appUrl?: string
  appId?: number
}

type DeclaredApp = { name?: string; url?: string; listedAppId?: number }

const HTTP_PROTOCOLS = new Set(['http:', 'https:'])

const toHttpOriginPath = (url?: string): string | undefined => {
  if (!url) return
  try {
    if (!HTTP_PROTOCOLS.has(new URL(url).protocol)) return
  } catch {
    return
  }
  return getOriginPath(url)
}

export function buildDeclared(channel: NativeChannel): DeclaredAttribution
export function buildDeclared(channel: AppChannel, app?: DeclaredApp): DeclaredAttribution
export function buildDeclared(channel: DeclaredChannel, app?: DeclaredApp): DeclaredAttribution {
  if (!app) return { channel }

  const appUrl = toHttpOriginPath(app.url)
  const appId = channel === 'SAFE_APP' ? app.listedAppId : undefined

  return {
    channel,
    ...(app.name && { appName: app.name }),
    ...(appUrl && { appUrl }),
    ...(appId !== undefined && { appId }),
  }
}
