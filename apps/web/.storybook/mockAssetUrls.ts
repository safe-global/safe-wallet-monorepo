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

/**
 * Whether a remote image URL belongs in the mirror. CoinGecko serves its images without an extension.
 * No SVG: Storybook is deployed on the dev/staging app's origin, where an opened SVG could run script.
 */
export function isMirroredImage(url: URL): boolean {
  if (url.protocol !== 'https:' || SKIPPED_HOSTS.has(url.hostname)) return false
  return (
    /\.(png|jpe?g|webp|gif)$/i.test(url.pathname) ||
    (url.hostname === 'assets.coingecko.com' && url.pathname.startsWith('/coins/images/'))
  )
}

/** Location of an image in the mirror, as a file path below mock-assets/. The query string is ignored. */
export const mirrorPath = (url: URL): string => `${url.hostname}${decodeURIComponent(url.pathname)}`

// An encoded slash (%2F) survives URL parsing, so '..' can only be caught after decoding
const isInsideMirror = (file: string): boolean =>
  !file.includes('\\') && !file.split('/').some((segment) => segment === '.' || segment === '..')

const IMAGE_SIGNATURES: Array<[format: string, offset: number, bytes: number[]]> = [
  ['png', 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  ['jpeg', 0, [0xff, 0xd8, 0xff]],
  ['gif', 0, [0x47, 0x49, 0x46, 0x38]],
  ['webp', 8, [0x57, 0x45, 0x42, 0x50]],
]

/** The raster format of a file by its first bytes, or undefined (SVG, HTML, anything else). */
export function imageFormat(bytes: Uint8Array): string | undefined {
  const match = IMAGE_SIGNATURES.find(([, offset, signature]) =>
    signature.every((byte, i) => bytes[offset + i] === byte),
  )
  return match?.[0]
}

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
    if (!url || !isMirroredImage(url) || !isInsideMirror(mirrorPath(url))) continue
    if (!byPath.has(mirrorPath(url))) byPath.set(mirrorPath(url), url.href)
  }
  return [...byPath.keys()].sort().map((key) => byPath.get(key) as string)
}
