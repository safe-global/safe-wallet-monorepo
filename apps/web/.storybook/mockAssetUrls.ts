// Shared by the MSW handler in mockAssets.ts and scripts/storybook/mirror-assets.ts: no Node or MSW imports.

export const MOCK_ASSETS_PATH = '/mock-assets'

// Hosts that stories use on purpose to show a broken image, or that no longer exist
const SKIPPED_HOSTS = new Set([
  'example.com',
  'invalid-url.com',
  'mock.images',
  'test-dapp.com',
  'app.com',
  'via.placeholder.com',
  'cloudflare-ipfs.com',
])

/** Whether a remote image URL belongs in the mirror. CoinGecko serves its images without an extension. */
export function isMirroredImage(url: URL): boolean {
  if (url.protocol !== 'https:' || SKIPPED_HOSTS.has(url.hostname)) return false
  return (
    /\.(png|svg|jpe?g|webp|gif)$/i.test(url.pathname) ||
    (url.hostname === 'assets.coingecko.com' && url.pathname.startsWith('/coins/images/'))
  )
}

/** Location of an image in the mirror, as a file path below mock-assets/. The query string is ignored. */
export const mirrorPath = (url: URL): string => `${url.hostname}${decodeURIComponent(url.pathname)}`

/** The same-origin URL of a mirrored image, or `src` unchanged when it is not mirrorable. */
export function localMirrorUrl(src: string): string {
  const url = URL.canParse(src) ? new URL(src) : undefined
  return url && isMirroredImage(url) ? `${MOCK_ASSETS_PATH}/${url.hostname}${url.pathname}` : src
}

/** Picks the distinct mirrorable images from raw URL strings, one per mirror path, sorted. */
export function imageUrls(candidates: string[]): string[] {
  const byPath = new Map<string, string>()
  for (const candidate of candidates) {
    const url = URL.canParse(candidate) ? new URL(candidate) : undefined
    if (url && isMirroredImage(url) && !byPath.has(mirrorPath(url))) byPath.set(mirrorPath(url), url.href)
  }
  return [...byPath.keys()].sort().map((key) => byPath.get(key) as string)
}
