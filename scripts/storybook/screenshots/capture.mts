/**
 * Storybook screenshots for decks and marketing: captures stories from a deployed preview (sample data only)
 * as WebP into <out>/live (Pages/*) and <out>/preview, with an index.json per folder and a skipped.txt.
 *
 * Usage (Node 24+): yarn workspace @safe-global/web storybook:screenshots --base=<branch or preview URL> [options]
 *   --base=<x>         Branch name (design/policies-m2), "dev", or preview URL. Only *.review.5afe.dev,
 *                      the dev environment and localhost are accepted, never production.
 *   --stories=<x>      Comma-separated story ids or title globs (default "Pages/**").
 *                      "*" stays within one title segment, "**" crosses segments, case-insensitive.
 *   --themes=<x>       light,dark (default both)
 *   --sizes=<x>        desktop (1440x900), wide (1920x1080) (default desktop)
 *   --scale=<n>        Device pixel ratio (default 2)
 *   --crop=<x>         viewport (default) or component: crop to what the story paints, for close-ups
 *   --out=<dir>        Output folder (default <repo>/screenshots)
 *   --quality=<n>      WebP quality 0-1 (default 0.92)
 *   --concurrency=<n>  Parallel pages (default 3)
 */

import * as fs from 'fs'
import * as path from 'path'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { resolveBase, selectStories, statusOf, type Status, type StoryEntry } from './stories.ts'

declare global {
  interface Window {
    __STORYBOOK_ADDONS_CHANNEL__?: { last: (eventName: string) => unknown }
  }
}

// storybook/internal/core-events STORY_FINISHED, inlined so CI only needs playwright
const STORY_FINISHED = 'storyFinished'

const SIZES: Record<string, { width: number; height: number }> = {
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
}
const THEMES = ['light', 'dark']
const COMPONENT_PADDING = 32
const COMPONENT_FILL_SLACK = 40

const STORY_FINISHED_TIMEOUT_MS = 30000
const NETWORK_IDLE_TIMEOUT_MS = 15000
const NETWORK_QUIET_MS = 500
const LOADERS_TIMEOUT_MS = 20000
const SETTLE_MS = 800
const MAX_ATTEMPTS = 3
const RETRY_DELAY_MS = 5000

// Determinate progress bars (aria-valuenow) are content, not loaders
const LOADER_SELECTORS = [
  '.animate-spin',
  '.animate-pulse',
  '[data-slot="skeleton"]',
  '.MuiSkeleton-root',
  '.MuiCircularProgress-indeterminate',
  '.MuiLinearProgress-indeterminate',
  '[role="progressbar"]:not([aria-valuenow])',
  '[aria-busy="true"]',
  '.sb-preparing-story',
  '.sb-preparing-docs',
]

// Scrollbars, Storybook's page padding, and the dev-only toggles and Developer group (hidden in production)
const HIDE_CSS = `
  *::-webkit-scrollbar { display: none !important; }
  html, body, * { scrollbar-width: none !important; }
  .sb-main-padded { padding: 0 !important; }
  [data-testid="sidebar-common-footer"] > :has(#dark-mode-toggle, #prod-cgw-toggle) { display: none !important; }
  [data-sidebar="group"]:has([data-testid="sidebar-feature-flags-item"]) { display: none !important; }
`

interface BuildInfo {
  commit?: string
  branch?: string
  version?: string
  buildTime?: string
}

interface Job {
  story: StoryEntry
  theme: string
  size: string
}

interface IndexEntry {
  name: string
  dark: boolean
  w: number
  h: number
  bleed: boolean
  status: Status
  theme: string
  size: string
  story: string
  source: string
  branch: string | null
  commit: string | null
  version: string | null
  capturedAt: string
}

type Result = { ok: true; status: Status; key: string; entry: IndexEntry } | { ok: false; reason: string }

// Accepts --key=value and --key value
function parseArgs(argv: string[]): Record<string, string> {
  const args: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const m = argv[i].match(/^--([^=]+)(?:=(.*))?$/)
    if (!m) continue
    if (m[2] !== undefined) args[m[1]] = m[2]
    else if (argv[i + 1] && !argv[i + 1].startsWith('--')) args[m[1]] = argv[++i]
    else args[m[1]] = 'true'
  }
  return args
}

function findRepoRoot(from: string): string | null {
  for (let dir = from; ; dir = path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'turbo.json')) && fs.existsSync(path.join(dir, 'yarn.lock'))) return dir
    if (path.dirname(dir) === dir) return null
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`)
  return (await res.json()) as T
}

type CachedAsset = { status: number; headers: Record<string, string>; body: Buffer }

const STATIC_ASSET = /\.(js|css|woff2?|svg|png|webp|jpe?g|gif)$/
const assetCache = new Map<string, Promise<CachedAsset | null>>()
let assetCacheHits = 0

// Fresh contexts share no HTTP cache, and re-downloading the bundle per capture makes the CDN drop chunks
async function serveStaticAssetsFromCache(context: BrowserContext, site: string): Promise<void> {
  const origin = new URL(site).origin
  await context.route(
    (url) => url.origin === origin && STATIC_ASSET.test(url.pathname),
    async (route) => {
      const key = route.request().url()
      let pending = assetCache.get(key)
      if (pending) assetCacheHits += 1
      else {
        pending = route
          .fetch()
          .then(async (res) =>
            res.ok() ? { status: res.status(), headers: res.headers(), body: await res.body() } : null,
          )
          .catch(() => null)
        assetCache.set(key, pending)
      }
      const asset = await pending
      if (asset) return route.fulfill(asset)
      assetCache.delete(key)
      return route.continue()
    },
  )
}

async function launch(): Promise<Browser> {
  try {
    // Prefer system Chrome, like render-sweep.ts: the repo does not ship playwright browsers
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    return await chromium.launch()
  }
}

// Counts requests still open, so "network idle" means nothing in flight for NETWORK_QUIET_MS
function trackRequests(page: Page): () => { inflight: number; lastChange: number } {
  let inflight = 0
  let lastChange = Date.now()
  const done = () => {
    inflight = Math.max(0, inflight - 1)
    lastChange = Date.now()
  }
  page.on('request', () => {
    inflight += 1
    lastChange = Date.now()
  })
  page.on('requestfinished', done)
  page.on('requestfailed', done)
  return () => ({ inflight, lastChange })
}

async function waitForNetworkIdle(page: Page, state: () => { inflight: number; lastChange: number }): Promise<boolean> {
  const deadline = Date.now() + NETWORK_IDLE_TIMEOUT_MS
  while (Date.now() < deadline) {
    const s = state()
    if (s.inflight === 0 && Date.now() - s.lastChange >= NETWORK_QUIET_MS) return true
    await page.waitForTimeout(100)
  }
  return false
}

async function waitForStoryFinished(page: Page): Promise<boolean> {
  return page
    .waitForFunction(
      (eventName) =>
        window.__STORYBOOK_ADDONS_CHANNEL__?.last(eventName) !== undefined ||
        document.body.classList.contains('sb-show-errordisplay'),
      STORY_FINISHED,
      { timeout: STORY_FINISHED_TIMEOUT_MS },
    )
    .then(
      () => true,
      () => false,
    )
}

// Two clear checks in a row, since a spinner can blink off between two requests
async function waitForNoLoaders(page: Page): Promise<string | null> {
  const deadline = Date.now() + LOADERS_TIMEOUT_MS
  let clearChecks = 0
  let last: string | null = null
  while (Date.now() < deadline) {
    last = await page.evaluate((selectors) => {
      for (const selector of selectors) {
        for (const el of document.querySelectorAll<HTMLElement>(selector)) {
          const r = el.getBoundingClientRect()
          const onScreen = r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < window.innerHeight
          if (onScreen && el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return selector
        }
      }
      return null
    }, LOADER_SELECTORS)
    clearChecks = last ? 0 : clearChecks + 1
    if (clearChecks >= 2) return null
    await page.waitForTimeout(250)
  }
  return last
}

// An init script also reaches the iframes of canvas stories
async function hideDevOnlyUi(context: BrowserContext): Promise<void> {
  await context.addInitScript((css) => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style')
      style.textContent = css
      document.head.append(style)
    })
  }, HIDE_CSS)
}

// Prototype stories carry a "Prototype · Jump to" bar that hides itself on "."
async function hidePrototypeBar(page: Page): Promise<void> {
  if (await page.getByText('Press "." to hide').isVisible()) {
    await page.locator('body').focus()
    await page.keyboard.press('.')
    await page.getByText('Press "." to hide').waitFor({ state: 'hidden', timeout: 5000 })
  }
}

// Retries failed images once: static assets sometimes miss while the MSW worker starts up
async function waitForImages(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const settle = (img: HTMLImageElement) =>
      new Promise((resolve) => {
        img.addEventListener('load', resolve, { once: true })
        img.addEventListener('error', resolve, { once: true })
      })
    await document.fonts.ready
    await Promise.all(
      Array.from(document.images)
        .filter((img) => !img.complete)
        .map(settle),
    )
    const broken = Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0 && img.src)
    await Promise.all(
      broken.map((img) => {
        const pending = settle(img)
        const src = img.src
        img.src = ''
        img.src = src
        return pending
      }),
    )
  })
}

// Playwright only writes PNG/JPEG
async function toWebp(encoder: Page, png: Buffer, quality: number): Promise<Buffer> {
  const dataUrl = await encoder.evaluate(
    async ({ b64, q }) => {
      const img = new Image()
      img.src = `data:image/png;base64,${b64}`
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')!.drawImage(img, 0, 0)
      return canvas.toDataURL('image/webp', q)
    },
    { b64: png.toString('base64'), q: quality },
  )
  if (!dataUrl.startsWith('data:image/webp')) throw new Error('This browser cannot encode WebP')
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64')
}

// Content plus the card and pill frames hugging it; larger frames are page or decorator backgrounds
async function componentClip(page: Page): Promise<{ x: number; y: number; width: number; height: number } | undefined> {
  const box = await page.evaluate((fillSlack) => {
    const root = document.querySelector('#storybook-root')
    if (!root) return null
    const portals = Array.from(document.body.children).filter(
      (el) => el !== root && !el.matches('script, style, #storybook-docs'),
    )
    const content = { x1: Infinity, y1: Infinity, x2: -Infinity, y2: -Infinity }
    const fills: DOMRect[] = []
    const grow = (b: typeof content, r: DOMRect) => {
      b.x1 = Math.min(b.x1, r.left)
      b.y1 = Math.min(b.y1, r.top)
      b.x2 = Math.max(b.x2, r.right)
      b.y2 = Math.max(b.y2, r.bottom)
    }
    for (const scope of [root, ...portals]) {
      for (const el of scope.querySelectorAll<HTMLElement>('*')) {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0 || !el.checkVisibility({ opacityProperty: true, visibilityProperty: true }))
          continue
        const cs = getComputedStyle(el)
        const isContent =
          (el.children.length === 0 &&
            (el.textContent?.trim() || /^(IMG|SVG|CANVAS|INPUT|VIDEO)$/i.test(el.tagName))) ||
          /^(svg|img)$/i.test(el.tagName)
        const isFrame =
          !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor) ||
          parseFloat(cs.borderTopWidth) > 0 ||
          cs.boxShadow !== 'none'
        if (isContent) grow(content, r)
        else if (isFrame) fills.push(r)
      }
    }
    if (!Number.isFinite(content.x1)) return null
    const box = { ...content }
    for (const r of fills) {
      const near =
        r.left >= content.x1 - fillSlack &&
        r.top >= content.y1 - fillSlack &&
        r.right <= content.x2 + fillSlack &&
        r.bottom <= content.y2 + fillSlack
      if (near) grow(box, r)
    }
    // Clamp to the smallest square-cornered background around the component so its edge never shows
    let wrapper: { left: number; top: number; right: number; bottom: number } | null = null
    for (const scope of [root, ...portals]) {
      for (const el of [scope, ...scope.querySelectorAll<HTMLElement>('*')]) {
        const r = el.getBoundingClientRect()
        const cs = getComputedStyle(el)
        const wraps = r.left <= box.x1 && r.top <= box.y1 && r.right >= box.x2 && r.bottom >= box.y2
        if (
          !wraps ||
          /^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor) ||
          parseFloat(cs.borderTopLeftRadius) > 0
        )
          continue
        if (
          !wrapper ||
          (r.right - r.left) * (r.bottom - r.top) < (wrapper.right - wrapper.left) * (wrapper.bottom - wrapper.top)
        )
          wrapper = { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
      }
    }
    return { ...box, wrapper, vw: window.innerWidth, vh: window.innerHeight }
  }, COMPONENT_FILL_SLACK)
  if (!box) return undefined
  const bounds = box.wrapper ?? { left: 0, top: 0, right: box.vw, bottom: box.vh }
  const x = Math.max(0, Math.ceil(bounds.left), Math.floor(box.x1 - COMPONENT_PADDING))
  const y = Math.max(0, Math.ceil(bounds.top), Math.floor(box.y1 - COMPONENT_PADDING))
  return {
    x,
    y,
    width: Math.min(box.vw, Math.floor(bounds.right), Math.ceil(box.x2 + COMPONENT_PADDING)) - x,
    height: Math.min(box.vh, Math.floor(bounds.bottom), Math.ceil(box.y2 + COMPONENT_PADDING)) - y,
  }
}

async function capture(
  context: BrowserContext,
  encoder: Page,
  storybook: string,
  job: Job,
  opts: { outDir: string; scale: number; quality: number; build: BuildInfo; branch: string | null; crop: string },
): Promise<Result> {
  const { story, theme, size } = job
  const source = `${storybook}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme}`
  const page = await context.newPage()
  const requests = trackRequests(page)
  try {
    await page.goto(source, { waitUntil: 'load', timeout: 60000 })
    if (!(await waitForStoryFinished(page))) return { ok: false, reason: 'story did not finish rendering in 30s' }

    const sbError = await page.evaluate(() =>
      document.body.classList.contains('sb-show-errordisplay')
        ? (document.querySelector('#error-message')?.textContent || 'unknown error').trim().slice(0, 200)
        : null,
    )
    if (sbError !== null) return { ok: false, reason: `Storybook error: ${sbError}` }

    if (!(await waitForNetworkIdle(page, requests))) {
      console.error(`    network still busy after ${NETWORK_IDLE_TIMEOUT_MS / 1000}s, relying on the loader check`)
    }
    await page.evaluate(() => document.fonts.ready)
    const loader = await waitForNoLoaders(page)
    if (loader) return { ok: false, reason: `still loading after ${LOADERS_TIMEOUT_MS / 1000}s (${loader} visible)` }

    await hidePrototypeBar(page)
    await waitForImages(page)
    await page.waitForTimeout(SETTLE_MS)

    const blank = await page.evaluate(() => document.body.innerText.trim().length === 0)
    if (blank) return { ok: false, reason: 'rendered no content' }
    const emptyMain = await page.evaluate(() => {
      const main = document.querySelector('main')
      // A drawer or dialog story opens over an empty page on purpose
      const overlay = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).some((el) =>
        el.checkVisibility(),
      )
      return main !== null && !overlay && main.innerText.trim().length === 0
    })
    if (emptyMain) return { ok: false, reason: 'page content area is empty (sidebar and header only)' }
    const broken = await page.evaluate(
      () =>
        Array.from(document.images).find(
          (img) => img.complete && img.naturalWidth === 0 && img.getBoundingClientRect().width > 0,
        )?.src,
    )
    if (broken) return { ok: false, reason: `image failed to load (${broken.slice(0, 120)})` }

    const clip = opts.crop === 'component' ? await componentClip(page) : undefined
    if (opts.crop === 'component' && !clip) return { ok: false, reason: 'found no component to crop to' }
    const png = await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide', clip })
    const webp = await toWebp(encoder, png, opts.quality)

    const status = statusOf(story)
    const frame = opts.crop === 'component' ? 'component' : size
    const key = `${story.id}-${theme}-${frame}`
    fs.mkdirSync(path.join(opts.outDir, status), { recursive: true })
    fs.writeFileSync(path.join(opts.outDir, status, `${key}.webp`), webp)

    return {
      ok: true,
      status,
      key,
      entry: {
        name: `${story.title} · ${story.name} (${theme})`,
        dark: theme === 'dark',
        // PNG IHDR: width and height are the big-endian words at bytes 16 and 20
        w: png.readUInt32BE(16),
        h: png.readUInt32BE(20),
        bleed: false,
        status,
        theme,
        size: frame,
        story: story.id,
        source,
        branch: opts.build.branch ?? opts.branch,
        commit: opts.build.commit ?? null,
        version: opts.build.version ?? null,
        capturedAt: new Date().toISOString(),
      },
    }
  } catch (err) {
    return { ok: false, reason: `failed: ${String(err).split('\n')[0].slice(0, 200)}` }
  } finally {
    await page.close()
  }
}

function writeIndex(dir: string, entries: Record<string, IndexEntry>): void {
  const file = path.join(dir, 'index.json')
  const existing = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, IndexEntry>) : {}
  const merged = { ...existing, ...entries }
  const sorted = Object.fromEntries(
    Object.keys(merged)
      .sort()
      .map((k) => [k, merged[k]]),
  )
  fs.writeFileSync(file, JSON.stringify(sorted, null, 1) + '\n')
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  if (!args.base) {
    console.error('Missing --base. Example: yarn workspace @safe-global/web storybook:screenshots --base=dev')
    process.exit(1)
  }

  const { site, storybook, branch } = resolveBase(args.base)
  const patterns = (args.stories || 'Pages/**')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const themes = (args.themes || 'light,dark').split(',').map((s) => s.trim())
  const sizes = (args.sizes || 'desktop').split(',').map((s) => s.trim())
  const scale = Number(args.scale) || 2
  const crop = args.crop || 'viewport'
  const quality = Math.min(1, Math.max(0, Number(args.quality) || 0.92))
  const concurrency = Number(args.concurrency) || 3
  const invokedFrom = process.env.INIT_CWD || process.cwd()
  const outDir = args.out
    ? path.resolve(invokedFrom, args.out)
    : path.join(findRepoRoot(invokedFrom) ?? invokedFrom, 'screenshots')

  for (const t of themes) if (!THEMES.includes(t)) throw new Error(`Unknown theme "${t}" (use ${THEMES.join(', ')})`)
  for (const s of sizes) if (!SIZES[s]) throw new Error(`Unknown size "${s}" (use ${Object.keys(SIZES).join(', ')})`)

  const build = await fetchJson<BuildInfo>(`${site}/version.json`).catch(() => ({}) as BuildInfo)
  const index = await fetchJson<{ entries: Record<string, StoryEntry> }>(`${storybook}/index.json`).catch((err) => {
    throw new Error(
      `Could not load the story list from ${storybook}/index.json. Has the preview deployed? (${err.message})`,
    )
  })
  const stories = selectStories(Object.values(index.entries), patterns)
  if (!stories.length) {
    const titles = [...new Set(Object.values(index.entries).map((e) => e.title.split('/').slice(0, 2).join('/')))]
    console.error(
      `No stories match ${patterns.join(', ')}. Top-level titles on this preview:\n  ${titles.join('\n  ')}`,
    )
    process.exit(1)
  }

  const jobs: Job[] = []
  for (const story of stories) for (const size of sizes) for (const theme of themes) jobs.push({ story, theme, size })
  console.error(
    `Capturing ${stories.length} stories x ${themes.length} themes x ${sizes.length} sizes from ${storybook}` +
      (build.commit ? ` (${build.branch ?? branch} @ ${build.commit.slice(0, 7)})` : ''),
  )
  console.error(`Saving to ${outDir}`)

  const browser = await launch()
  const encoder = await (await browser.newContext()).newPage()
  const captured: Record<Status, Record<string, IndexEntry>> = { live: {}, preview: {} }
  const skipped: string[] = []
  const queue = [...jobs]
  let done = 0

  async function worker(): Promise<void> {
    for (let job = queue.shift(); job; job = queue.shift()) {
      let result: Result = { ok: false, reason: 'not attempted' }
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !result.ok; attempt++) {
        if (attempt > 0) {
          // Chunk load failures are network noise; other Storybook errors are the story's
          if (result.reason.startsWith('Storybook error') && !/Loading (CSS )?chunk/.test(result.reason)) break
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS * attempt))
        }
        // Fresh context per attempt so app state never leaks between stories
        const context = await browser.newContext({
          viewport: SIZES[job.size],
          deviceScaleFactor: scale,
          colorScheme: job.theme as 'light' | 'dark',
          reducedMotion: 'reduce',
        })
        await serveStaticAssetsFromCache(context, site)
        await hideDevOnlyUi(context)
        result = await capture(context, encoder, storybook, job, { outDir, scale, quality, build, branch, crop })
        await context.close()
      }
      done += 1
      const label = `${job.story.id} ${job.theme} ${crop === 'component' ? 'component' : job.size}`
      if (result.ok) {
        captured[result.status][result.key] = result.entry
        console.error(`  [${done}/${jobs.length}] ok    ${result.status}/${result.key}.webp`)
      } else {
        skipped.push(`${label}  ${result.reason}`)
        console.error(`  [${done}/${jobs.length}] skip  ${label}: ${result.reason}`)
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker))
  await browser.close()

  for (const status of ['live', 'preview'] as const) {
    if (Object.keys(captured[status]).length) writeIndex(path.join(outDir, status), captured[status])
  }
  fs.mkdirSync(outDir, { recursive: true })
  const skippedFile = path.join(outDir, 'skipped.txt')
  if (skipped.length) fs.writeFileSync(skippedFile, skipped.sort().join('\n') + '\n')
  else fs.rmSync(skippedFile, { force: true })

  const total = Object.keys(captured.live).length + Object.keys(captured.preview).length
  console.error(`Done: ${total} captured, ${skipped.length} skipped${skipped.length ? ` (see ${skippedFile})` : ''}`)
  console.error(`${assetCache.size} static files downloaded once, served ${assetCacheHits} times from cache`)
  process.exitCode = total === 0 ? 1 : 0
}

main().catch((err) => {
  console.error(String(err instanceof Error ? err.message : err))
  process.exit(1)
})
