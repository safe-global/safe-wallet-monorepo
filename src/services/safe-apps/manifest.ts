import { trimTrailingSlash } from '@/utils/url'
import { SafeAppAccessPolicyTypes, SafeAppData } from '@gnosis.pm/safe-react-gateway-sdk'

type AppManifestIcon = {
  src: string
  sizes: string
  type?: string
  purpose?: string
}

export type AppManifest = {
  // SPEC: https://developer.mozilla.org/en-US/docs/Web/Manifest
  name: string
  short_name?: string
  description: string
  icons?: AppManifestIcon[]
  iconPath?: string
}

// The icons URL can be any of the following format:
// - https://example.com/icon.png
// - icon.png
// - /icon.png
// This function calculates the absolute URL of the icon taking into account the
// different formats.
const getAppLogoUrl = (appUrl: string, { icons = [], iconPath = '' }: AppManifest) => {
  const iconUrl = icons.length ? icons[0].src : iconPath
  const includesBaseUrl = iconUrl.startsWith('https://')
  if (includesBaseUrl) {
    return iconUrl
  }

  const isRelativeUrl = iconUrl.startsWith('/')
  if (isRelativeUrl) {
    const appUrlHost = new URL(appUrl).host
    return `${appUrlHost}${iconUrl}`
  }

  return `${appUrl}/${iconUrl}`
}

const fetchAppManifest = async (appUrl: string, timeout = 5000): Promise<unknown> => {
  const normalizedUrl = trimTrailingSlash(appUrl)
  const manifestUrl = `${normalizedUrl}/manifest.json`

  // A lot of apps are hosted on IPFS and IPFS never times out, so we add our own timeout
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)

  const response = await fetch(manifestUrl, {
    signal: controller.signal,
  })
  clearTimeout(id)

  if (!response.ok) {
    throw new Error(`Failed to fetch manifest from ${manifestUrl}`)
  }

  return response.json()
}

const isAppManifestValid = (json: unknown): json is AppManifest => {
  return (
    json != null &&
    typeof json === 'object' &&
    'name' in json &&
    'description' in json &&
    ('icons' in json || 'iconPath' in json)
  )
}

const fetchSafeAppFromManifest = async (appUrl: string, currentChainId: string): Promise<SafeAppData> => {
  const normalizedAppUrl = trimTrailingSlash(appUrl)
  const appManifest = await fetchAppManifest(appUrl)

  if (!isAppManifestValid(appManifest)) {
    throw new Error('Invalid app manifest')
  }

  const iconUrl = getAppLogoUrl(normalizedAppUrl, appManifest)

  return {
    id: Math.random(),
    url: normalizedAppUrl,
    name: appManifest.name,
    description: appManifest.description,
    accessControl: { type: SafeAppAccessPolicyTypes.NoRestrictions },
    tags: [],
    chainIds: [currentChainId],
    iconUrl,
  }
}

export { fetchAppManifest, isAppManifestValid, getAppLogoUrl, fetchSafeAppFromManifest }
