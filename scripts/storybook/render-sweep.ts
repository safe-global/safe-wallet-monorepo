/**
 * Storybook render sweep
 *
 * Loads every story headless in light + dark and flags broken renders:
 * - SB_ERROR: Storybook error display shown (missing decorator/provider, throw on mount)
 * - EMPTY_ROOT: nothing mounted into #storybook-root (NB: overlay stories that portal
 *   their content to <body> can false-positive — check before filing)
 * - BLANK_RENDER: mounted but paints no text and no visible box (missing mock data)
 * - PAGE_ERROR / CONSOLE: uncaught errors while loading
 * - RENDER_TIMEOUT: the story (play function included) did not finish in time
 * - UNSTABLE_SCREENSHOT: (with --shots) the pixels kept changing until the settle timeout
 *
 * Usage (from apps/web): yarn storybook:sweep [-- --filter=ui- --modes=light --concurrency=4]
 *   --base=<url>        Storybook to sweep (default http://localhost:6006 or $SB_BASE).
 *                       For static builds serve on a port whitelisted in OFFICIAL_HOSTS
 *                       (e.g. 4000) or host-gated pages (Imprint/Licenses) flag as blank.
 *   --filter=<substr>   Only story ids/titles containing this substring
 *   --modes=light,dark  Themes to sweep (default both)
 *   --shard=k/n         Only sweep shard k of n; whole titles per shard (see shardStories)
 *   --concurrency=N     Parallel pages (default 8; static builds tolerate 10+, the
 *                       webpack dev server does not)
 *   --shots=<dir>       Also save screenshots into <dir> as sheets (see sheets.ts): one image per
 *                       title with every story x mode, and one per fullscreen (page) story
 *   --manifest=<file>   With --shots: also write { sheet file: sha256 } here (see diff-manifest.ts)
 *   --json=<file>       Write findings JSON here (default: stdout)
 *
 * Known noise under high concurrency: sporadic "Cannot read properties of undefined
 * (reading 'url')" page errors from the MSW worker lifecycle — they do not reproduce
 * interactively; ignore unless a story also flags EMPTY/BLANK.
 */

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { pathToFileURL } from 'url'
import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { STORY_FINISHED } from 'storybook/internal/core-events'
import { hashImage, type Manifest } from './manifest'
import { planSheets, shardStories, sheetHtml, type Cell, type Sheet } from './sheets'

declare global {
  interface Window {
    __STORYBOOK_ADDONS_CHANNEL__?: { last: (eventName: string) => unknown }
  }
}

const STORY_FINISHED_TIMEOUT_MS = 30000
// Settling: no open request for QUIET_MS, then two identical screenshots QUIET_MS apart.
// Loading-state stories hold a request open (MSW delay('infinite')), so both waits are capped.
const QUIET_MS = 100
const SETTLE_TIMEOUT_MS = 3000
// Stories date their mock data from Date.now(); a fixed clock and time zone keep shown dates the same every day
const FIXED_NOW = new Date('2026-01-15T12:00:00Z')
const TIMEZONE = 'UTC'
// Faker and other story data take their seed from Math.random, so every page gets the same sequence (mulberry32)
const SEEDED_RANDOM = `(() => {
  let seed = 1
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
})()`

type Mode = string

interface StoryEntry {
  id: string
  title: string
  name: string
  type: string
  tags?: string[]
}

interface Finding {
  id: string
  title: string
  name: string
  mode: Mode
  issues: string[]
  textSample?: string
}

function parseArgs(): Record<string, string | boolean> {
  return Object.fromEntries(
    process.argv.slice(2).map((a) => {
      const m = a.match(/^--([^=]+)=(.*)$/)
      return m ? [m[1], m[2]] : [a.replace(/^--/, ''), true]
    }),
  )
}

const LAUNCH_ARGS = [
  // GPU rasterization varies a few colour levels between runs, which changes the sheet hashes
  '--disable-gpu',
  // Stories load token logos from live CDNs; MSW's service worker fetches them, out of Playwright's
  // reach, so they arrive late or not at all. Failing every external host makes them render
  // their local fallback in every run. MSW mocks are unaffected: the worker answers them first.
  '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost',
]

async function launch(): Promise<Browser> {
  try {
    // Prefer system Chrome — the repo does not ship playwright browser binaries
    return await chromium.launch({ channel: 'chrome', args: LAUNCH_ARGS })
  } catch {
    return await chromium.launch({ args: LAUNCH_ARGS })
  }
}

// STORY_FINISHED is emitted after the play function, the animation wait and afterEach.
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

interface Clip {
  x: number
  y: number
  width: number
  height: number
}

const ASSET_TIMEOUT_MS = 5000

const MAX_VIEWPORT_HEIGHT = 8000

// Chrome leaves iframes below the viewport blank in a full-page screenshot, and TokenIcon renders
// every logo in an iframe. Grow the viewport over them; other stories keep their layout.
async function fitViewportToIframes(page: Page, openRequests: () => number): Promise<void> {
  const bottom = await page.evaluate(() =>
    Math.max(0, ...[...document.querySelectorAll('iframe')].map((f) => f.getBoundingClientRect().bottom + scrollY)),
  )
  const viewport = page.viewportSize()
  if (!viewport || bottom <= viewport.height) return
  await page.setViewportSize({ width: viewport.width, height: Math.min(Math.ceil(bottom), MAX_VIEWPORT_HEIGHT) })
  // Lazy iframes that are now in view start loading
  await waitForQuietNetwork(page, openRequests)
}

// Fonts and images that are still loading make the screenshot differ between runs.
async function waitForAssets(page: Page): Promise<void> {
  // Sandboxed iframes are out of the page's reach, so wait inside every frame
  const frames = page.frames().map((frame) =>
    frame
      .evaluate(async (timeoutMs) => {
        // decode() resolves once the image is loaded and ready to paint; broken images reject
        const decoded = [...document.images].map((img) => img.decode().catch(() => undefined))
        await Promise.race([
          Promise.all([document.fonts.ready, ...decoded]),
          new Promise((resolve) => setTimeout(resolve, timeoutMs)),
        ])
      }, ASSET_TIMEOUT_MS)
      // A frame can detach while we wait; the stable-screenshot check still covers it
      .catch(() => undefined),
  )
  await Promise.all(frames)
}

// Padded/centered stories are clipped to their content, portals (dialogs, popovers) included.
// Fullscreen stories and the error display keep the whole page.
async function contentClip(page: Page): Promise<{ fullscreen: boolean; clip?: Clip }> {
  return page.evaluate(() => {
    const body = document.body
    const fullscreen = body.classList.contains('sb-main-fullscreen')
    if (fullscreen || body.classList.contains('sb-show-errordisplay')) return { fullscreen }

    // No named helpers in here: tsx wraps them in a __name() call that does not exist in the page.
    // The root itself spans the full width, so only its descendants count.
    const elements = [...body.children].flatMap((el) => {
      if (el.id === 'storybook-root') return [...el.querySelectorAll('*')]
      const storybookChrome =
        el.id.startsWith('storybook-') ||
        [...el.classList].some((c) => c.startsWith('sb-')) ||
        ['SCRIPT', 'STYLE', 'LINK', 'NOSCRIPT'].includes(el.tagName)
      return storybookChrome ? [] : [el, ...el.querySelectorAll('*')]
    })

    let [left, top, right, bottom] = [Infinity, Infinity, -Infinity, -Infinity]
    for (const el of elements) {
      const r = el.getBoundingClientRect()
      if (r.width === 0 || r.height === 0) continue
      left = Math.min(left, r.left)
      top = Math.min(top, r.top)
      right = Math.max(right, r.right)
      bottom = Math.max(bottom, r.bottom)
    }
    if (left === Infinity) return { fullscreen }

    const pad = 8
    const x = Math.max(0, Math.floor(left + window.scrollX - pad))
    const y = Math.max(0, Math.floor(top + window.scrollY - pad))
    return {
      fullscreen,
      clip: {
        x,
        y,
        width: Math.ceil(right + window.scrollX + pad) - x,
        height: Math.ceil(bottom + window.scrollY + pad) - y,
      },
    }
  })
}

async function waitForQuietNetwork(page: Page, openRequests: () => number): Promise<void> {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS
  let quietSince = Date.now()
  while (Date.now() < deadline) {
    if (openRequests() > 0) quietSince = Date.now()
    else if (Date.now() - quietSince >= QUIET_MS) return
    await page.waitForTimeout(QUIET_MS / 4)
  }
}

// Re-renders after data arrives (or timers in app code) would otherwise be caught half-way.
async function stableScreenshot(page: Page): Promise<{ fullscreen: boolean; png: Buffer; stable: boolean }> {
  const deadline = Date.now() + SETTLE_TIMEOUT_MS
  let previous: Buffer | undefined
  for (;;) {
    const { fullscreen, clip } = await contentClip(page)
    // Spinners and transitions otherwise land on a different frame each run
    const png = await page.screenshot({ fullPage: true, clip, animations: 'disabled' })
    const stable = previous !== undefined && png.equals(previous)
    if (stable || Date.now() > deadline) return { fullscreen, png, stable }
    previous = png
    await page.waitForTimeout(QUIET_MS)
  }
}

async function checkStory(
  context: BrowserContext,
  base: string,
  story: StoryEntry,
  mode: Mode,
  cellsDir: string | undefined,
): Promise<{ finding: Finding; cell?: Cell }> {
  const page = await context.newPage()
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    // External hosts are blocked on purpose (LAUNCH_ARGS)
    const blockedExternal = msg.text().startsWith('Failed to load resource') && !msg.location().url.startsWith(base)
    if (!blockedExternal) consoleErrors.push(msg.text().slice(0, 300))
  })
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 300)))
  // MSW answers from a service worker, and Playwright still reports those requests
  let openRequests = 0
  page.on('request', () => openRequests++)
  page.on('requestfinished', () => openRequests--)
  page.on('requestfailed', () => openRequests--)

  const result: Finding = { id: story.id, title: story.title, name: story.name, mode, issues: [] }
  let cell: Cell | undefined
  try {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${mode}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })
    if (!(await waitForStoryFinished(page))) result.issues.push('RENDER_TIMEOUT')
    await waitForQuietNetwork(page, () => openRequests)

    const state = await page.evaluate(() => {
      const root = document.querySelector('#storybook-root')
      const sbError = document.body.classList.contains('sb-show-errordisplay')
      const errMsg = document.querySelector('#error-message')?.textContent?.slice(0, 300) || ''
      const text = root ? (root as HTMLElement).innerText.replace(/\s+/g, ' ').trim() : ''
      let visibleHeight = 0
      if (root) {
        for (const el of root.querySelectorAll('*')) {
          const r = el.getBoundingClientRect()
          if (r.height > visibleHeight) visibleHeight = r.height
          if (visibleHeight > 8) break
        }
      }
      return {
        empty: !root || root.childNodes.length === 0,
        sbError,
        errMsg,
        textLen: text.length,
        textSample: text.slice(0, 120),
        visibleHeight,
      }
    })

    if (state.sbError) result.issues.push(`SB_ERROR: ${state.errMsg}`)
    if (state.empty) result.issues.push('EMPTY_ROOT')
    else if (state.textLen === 0 && state.visibleHeight < 8) result.issues.push('BLANK_RENDER')
    if (pageErrors.length) result.issues.push(`PAGE_ERROR: ${pageErrors[0]}`)
    if (consoleErrors.length) result.issues.push(`CONSOLE: ${consoleErrors.slice(0, 2).join(' | ')}`)
    result.textSample = state.textSample

    // 'skip-visual-test' marks flaky/animated/interactive-only stories that must not be
    // pixel-snapshotted (successor of the Chromatic-era '!chromatic' negation tag, which
    // never reached index.json). They are still render-checked — only the screenshot is skipped.
    const skipSnapshot = story.tags?.includes('skip-visual-test')
    if (cellsDir && !skipSnapshot) {
      await fitViewportToIframes(page, () => openRequests)
      await waitForAssets(page)
      const { fullscreen, png, stable } = await stableScreenshot(page)
      if (!stable) result.issues.push('UNSTABLE_SCREENSHOT')
      const file = path.join(cellsDir, `${story.id}--${mode}.png`)
      fs.writeFileSync(file, png)
      cell = { storyId: story.id, name: story.name, mode, file, fullscreen }
    }
  } catch (err) {
    result.issues.push(`NAV_FAIL: ${String(err).slice(0, 200)}`)
  } finally {
    await page.close()
  }
  return { finding: result, cell }
}

async function writeSheets(browser: Browser, sheets: Sheet[], modes: Mode[], cellsDir: string, shotsDir: string) {
  fs.mkdirSync(shotsDir, { recursive: true })
  const queue = [...sheets]
  async function worker(): Promise<void> {
    const page = await browser.newPage()
    for (let sheet = queue.shift(); sheet; sheet = queue.shift()) {
      const html = path.join(cellsDir, `${sheet.file}.html`)
      fs.writeFileSync(html, sheetHtml(sheet, modes))
      await page.goto(pathToFileURL(html).href)
      await page.locator('table').screenshot({ path: path.join(shotsDir, sheet.file) })
    }
    await page.close()
  }
  await Promise.all(Array.from({ length: 4 }, worker))
}

async function main(): Promise<void> {
  const args = parseArgs()
  const base = (typeof args.base === 'string' && args.base) || process.env.SB_BASE || 'http://localhost:6006'
  const modes: Mode[] = (typeof args.modes === 'string' ? args.modes : 'light,dark').split(',')
  const concurrency = Number(args.concurrency) || 8
  const filter = typeof args.filter === 'string' ? args.filter : ''
  const shotsDir = typeof args.shots === 'string' ? args.shots : undefined
  const cellsDir = shotsDir ? fs.mkdtempSync(path.join(os.tmpdir(), 'sb-cells-')) : undefined

  const index = (await (await fetch(`${base}/index.json`)).json()) as { entries: Record<string, StoryEntry> }
  const matching = Object.values(index.entries).filter(
    (e) => e.type === 'story' && (!filter || e.id.includes(filter) || e.title.includes(filter)),
  )
  const [shard, shardCount] = typeof args.shard === 'string' ? args.shard.split('/').map(Number) : [1, 1]
  const stories = shardStories(matching, shard, shardCount)
  console.error(
    `Sweeping ${stories.length} stories x ${modes.length} modes (shard ${shard}/${shardCount}) against ${base}...`,
  )

  const browser = await launch()
  const results: Finding[] = []
  const cells: Cell[] = []
  const queue: Array<[StoryEntry, Mode]> = []
  for (const s of stories) for (const m of modes) queue.push([s, m])
  let done = 0

  async function worker(): Promise<void> {
    for (;;) {
      const item = queue.shift()
      if (!item) break
      // A context per story: localStorage and the like from one story (a collapsed sidebar) must not reach the next
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: TIMEZONE })
      await context.clock.setFixedTime(FIXED_NOW)
      await context.addInitScript({ content: SEEDED_RANDOM })
      const { finding, cell } = await checkStory(context, base, item[0], item[1], cellsDir).finally(() =>
        context.close(),
      )
      results.push(finding)
      if (cell) cells.push(cell)
      done += 1
      if (done % 50 === 0) console.error(`  ${done}/${stories.length * modes.length}`)
    }
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
  if (shotsDir && cellsDir) {
    const sheets = planSheets(
      cells,
      stories.map((s) => s.id),
      modes,
    )
    await writeSheets(browser, sheets, modes, cellsDir, shotsDir)
    fs.rmSync(cellsDir, { recursive: true, force: true })
    console.error(`Wrote ${sheets.length} sheets from ${cells.length} screenshots to ${shotsDir}`)
    if (typeof args.manifest === 'string') {
      const manifest: Manifest = Object.fromEntries(
        sheets.map((s) => [s.file, hashImage(fs.readFileSync(path.join(shotsDir, s.file)))]),
      )
      fs.writeFileSync(args.manifest, JSON.stringify(manifest, null, 1))
      console.error(`Wrote the hashes of ${sheets.length} sheets to ${args.manifest}`)
    }
  }
  await browser.close()

  const bad = results.filter((r) => r.issues.length)
  const report = JSON.stringify({ total: results.length, bad: bad.length, findings: bad }, null, 1)
  if (typeof args.json === 'string') {
    fs.writeFileSync(args.json, report)
    console.error(`Wrote ${bad.length} findings to ${args.json}`)
  } else {
    console.log(report)
  }
  process.exitCode = bad.some((f) => f.issues.some((i) => i.startsWith('SB_ERROR'))) ? 1 : 0
}

void main()
