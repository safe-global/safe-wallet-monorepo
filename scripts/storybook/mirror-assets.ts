/**
 * Mirrors the remote images that stories and MSW fixtures point at into
 * apps/web/.storybook/mock-assets/<host>/<path>, where Storybook serves them and the
 * handler in apps/web/.storybook/mockAssets.ts answers the original URLs from them.
 *
 * Only new images are downloaded; existing files are kept. Rerun after adding a story or
 * fixture with a new remote image, and commit the result.
 *
 * Usage (repo root): npx tsx scripts/storybook/mirror-assets.ts
 */

import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { imageUrls, mirrorPath } from '../../apps/web/.storybook/mockAssetUrls'
import { upgradeCoinGeckoThumbToQuality } from '../../packages/utils/src/utils/image'

const SOURCES = ['*.stories.tsx', 'config/test/**']
const MIRROR_DIR = 'apps/web/.storybook/mock-assets'
const TIMEOUT_MS = 15000

async function download(url: string, file: string): Promise<string | undefined> {
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) }).catch((err: unknown) => String(err))
  if (typeof res === 'string') return res
  if (!res.ok) return `HTTP ${res.status}`
  const type = res.headers.get('content-type') ?? ''
  // S3 buckets often serve images as octet-stream; an HTML error page is what must not get in
  if (!type.startsWith('image/') && type !== 'application/octet-stream') return `not an image (${type})`
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  return undefined
}

async function main(): Promise<void> {
  const text = execFileSync('git', ['grep', '-h', '-o', '-E', 'https://[^"\'` )]+', '--', ...SOURCES], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  // TokenIcon requests CoinGecko's 'small' variant of a /thumb/ URL, other components the URL as is
  const urls = imageUrls(text.split('\n').flatMap((url) => [url, upgradeCoinGeckoThumbToQuality(url, 'small') ?? url]))
  const fileOf = (url: string) => path.join(MIRROR_DIR, mirrorPath(new URL(url)))
  const missing = urls.filter((url) => !fs.existsSync(fileOf(url)))
  console.error(`${urls.length} image URLs, ${missing.length} not mirrored yet`)

  const failures: string[] = []
  for (let i = 0; i < missing.length; i += 8) {
    const batch = missing.slice(i, i + 8)
    const errors = await Promise.all(batch.map((url) => download(url, fileOf(url))))
    errors.forEach((error, k) => error && failures.push(`${batch[k]}: ${error}`))
  }
  if (failures.length) {
    console.error(`${failures.length} images could not be mirrored; stories show their fallback for these:`)
    for (const failure of failures) console.error(`  ${failure}`)
  }
}

void main()
