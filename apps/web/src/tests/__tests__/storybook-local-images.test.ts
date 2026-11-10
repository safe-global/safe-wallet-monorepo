/**
 * Keeps Storybook images local.
 *
 * Stories and `config/test` fixtures must reference images as `mock-assets/...` files, served from
 * `apps/web/.storybook/mock-assets`. Remote images made stories depend on live CDNs, which broke
 * the visual sweep. Only raster images are allowed: Storybook is deployed on the dev/staging
 * app's origin, where an opened SVG could run script.
 */
import * as fs from 'fs'
import * as path from 'path'

const REPO_ROOT = path.resolve(__dirname, '../../../../..')
const MOCK_ASSETS = path.join(REPO_ROOT, 'apps/web/.storybook/mock-assets')

// Hosts that stories use on purpose to show a broken image, or that no longer exist
const ALLOWED_REMOTE_HOSTS = new Set([
  'example.com',
  'invalid-url.com',
  'mock.images',
  'test-dapp.com',
  'app.com',
  'via.placeholder.com',
  'cloudflare-ipfs.com',
])

const REMOTE_IMAGE =
  /https:\/\/([^/"'`\s)]+)\/[^"'`\s)]*?(?:\.(?:png|jpe?g|gif|webp|svg)\b|coingecko\.com\/coins\/images\/)/gi
const LOCAL_IMAGE = /mock-assets\/[^"'`\s)]+/g

const RASTER_SIGNATURES: Array<[offset: number, bytes: number[]]> = [
  [0, [0x89, 0x50, 0x4e, 0x47]], // PNG
  [0, [0xff, 0xd8, 0xff]], // JPEG
  [0, [0x47, 0x49, 0x46, 0x38]], // GIF
  [8, [0x57, 0x45, 0x42, 0x50]], // WebP
]
const isRaster = (bytes: Buffer) =>
  RASTER_SIGNATURES.some(([offset, signature]) => signature.every((byte, i) => bytes[offset + i] === byte))

function sourceFiles(dir: string, keep: (file: string) => boolean): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name)
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : sourceFiles(file, keep)
    return keep(file) ? [file] : []
  })
}

// Stories and the mock data they import; src/tests holds Jest-only data
const isStoryData = (file: string) =>
  !/[/\\]src[/\\]tests[/\\]/.test(file) &&
  (file.endsWith('.stories.tsx') || /[/\\](mocks|stories)[/\\]/.test(file) || /(mockData|\.fixtures)\.tsx?$/.test(file))
const SOURCES = [
  ...sourceFiles(path.join(REPO_ROOT, 'config/test'), (file) => /\.(json|ts)$/.test(file)),
  ...sourceFiles(path.join(REPO_ROOT, 'apps/web/src'), isStoryData),
  ...sourceFiles(path.join(REPO_ROOT, 'packages/views/src'), isStoryData),
].map((file) => ({ file: path.relative(REPO_ROOT, file), text: fs.readFileSync(file, 'utf8') }))

describe('Storybook images', () => {
  it('reads the stories and fixtures', () => {
    expect(SOURCES.length).toBeGreaterThan(100)
  })

  it('never points a story or fixture at a remote image', () => {
    const remote = SOURCES.flatMap(({ file, text }) =>
      [...text.matchAll(REMOTE_IMAGE)].filter((m) => !ALLOWED_REMOTE_HOSTS.has(m[1])).map((m) => `${file}: ${m[0]}`),
    )

    // Fix: save the image to apps/web/.storybook/mock-assets as WebP (max 128 px) and reference it as
    // mock-assets/<host>/<path>.webp; use images/common/token-placeholder.svg for a logo that does not exist upstream
    expect(remote).toEqual([])
  })

  it('references only committed PNG, JPEG, GIF or WebP files under mock-assets', () => {
    // Paths built in code (`.../${address}.webp`) have no single file to check
    const references = new Set(
      SOURCES.flatMap(({ text }) => text.match(LOCAL_IMAGE) ?? []).filter((ref) => !ref.includes('${')),
    )
    const broken = [...references].filter((reference) => {
      const file = path.join(MOCK_ASSETS, reference.slice('mock-assets/'.length))
      // Compare the exact name: macOS ignores case, so `USDC.webp` would find `usdc.webp` there but not in CI
      const exists = fs.existsSync(file) && fs.readdirSync(path.dirname(file)).includes(path.basename(file))
      if (!file.startsWith(MOCK_ASSETS + path.sep) || !exists) return true
      return !isRaster(fs.readFileSync(file))
    })

    expect(references.size).toBeGreaterThan(0)
    expect(broken).toEqual([])
  })
})
