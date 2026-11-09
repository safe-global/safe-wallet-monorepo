/**
 * Mirrors the remote images that stories and MSW fixtures point at into
 * apps/web/.storybook/mock-assets/<host>/<path>, where Storybook serves them and the
 * handler in apps/web/.storybook/mockAssets.ts answers the original URLs from them.
 *
 * Only new images are downloaded; existing files are kept, and files that no story or fixture
 * references any more are removed. Rerun after adding or removing a remote image in a story or
 * fixture, and commit the result.
 *
 * Usage (repo root): npx tsx scripts/storybook/mirror-assets.ts
 */

import { execFileSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import { imageFormat, imageUrls, mirrorPath } from '../../apps/web/.storybook/mockAssetUrls'
import { upgradeCoinGeckoThumbToQuality } from '../../packages/utils/src/utils/image'

// Only what the web Storybook renders: its stories and the shared MSW fixtures, not the mobile stories
const SOURCES = ['apps/web/*.stories.tsx', 'packages/views/*.stories.tsx', 'config/test/']
const MIRROR_DIR = 'apps/web/.storybook/mock-assets'
const TIMEOUT_MS = 15000

async function download(url: string, file: string): Promise<string | undefined> {
  if (!path.resolve(file).startsWith(path.resolve(MIRROR_DIR) + path.sep)) return 'path outside the mirror'
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) }).catch((err: unknown) => String(err))
  if (typeof res === 'string') return res
  if (!res.ok) return `HTTP ${res.status}`
  // Check the bytes, not the content type: S3 sends images as octet-stream, and SVG or HTML must not get in
  const bytes = Buffer.from(await res.arrayBuffer())
  if (!imageFormat(bytes)) return `not a PNG, JPEG, GIF or WebP (${res.headers.get('content-type')})`
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, bytes)
  return undefined
}

async function main(): Promise<void> {
  const text = execFileSync('git', ['grep', '-h', '-o', '-E', 'https://[^"\'` )]+', '--', ...SOURCES], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
  // TokenIcon, the only component that renders CoinGecko logos, loads the 'small' variant of a /thumb/ URL
  const urls = imageUrls(text.split('\n').map((url) => upgradeCoinGeckoThumbToQuality(url, 'small') ?? url))
  const fileOf = (url: string) => path.join(MIRROR_DIR, mirrorPath(new URL(url)))
  const missing = urls.filter((url) => !fs.existsSync(fileOf(url)))
  console.error(`${urls.length} image URLs, ${missing.length} not mirrored yet`)

  // Logos of tokens removed from a fixture would otherwise stay in the repo forever
  const referenced = new Set(urls.map((url) => path.resolve(fileOf(url))))
  const mirrored = fs.existsSync(MIRROR_DIR) ? fs.readdirSync(MIRROR_DIR, { recursive: true, encoding: 'utf8' }) : []
  const orphans = mirrored.map((file) => path.resolve(MIRROR_DIR, file)).filter((file) => fs.statSync(file).isFile())
  const unreferenced = orphans.filter((file) => !referenced.has(file))
  for (const file of unreferenced) fs.rmSync(file)
  if (unreferenced.length) console.error(`Removed ${unreferenced.length} images that nothing references any more`)

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
