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
 *
 * Usage (from apps/web): yarn storybook:sweep [-- --filter=ui- --modes=light --concurrency=4]
 *   --base=<url>        Storybook to sweep (default http://localhost:6006 or $SB_BASE).
 *                       For static builds serve on a port whitelisted in OFFICIAL_HOSTS
 *                       (e.g. 4000) or host-gated pages (Imprint/Licenses) flag as blank.
 *   --filter=<substr>   Only story ids/titles containing this substring
 *   --modes=light,dark  Themes to sweep (default both)
 *   --concurrency=N     Parallel pages (default 8; static builds tolerate 10+, the
 *                       webpack dev server does not)
 *   --shots=<dir>       Also save screenshots into <dir> as sheets (see sheets.ts): one image per
 *                       title with every story x mode, and one per fullscreen (page) story
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
import { planSheets, sheetHtml, type Cell, type Sheet } from './sheets'

declare global {
  interface Window {
    __STORYBOOK_ADDONS_CHANNEL__?: { last: (eventName: string) => unknown }
  }
}

const STORY_FINISHED_TIMEOUT_MS = 30000

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

// GPU rasterization varies a few colour levels between runs, which changes the sheet hashes
const LAUNCH_ARGS = ['--disable-gpu']

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

// Fonts and images that are still loading make the screenshot differ between runs.
async function waitForAssets(page: Page): Promise<void> {
  await page.evaluate(async (timeoutMs) => {
    const pending = [...document.images]
      .filter((img) => !img.complete)
      .map(
        (img) =>
          new Promise((resolve) => {
            img.addEventListener('load', resolve)
            img.addEventListener('error', resolve)
          }),
      )
    await Promise.race([
      Promise.all([document.fonts.ready, ...pending]),
      new Promise((resolve) => setTimeout(resolve, timeoutMs)),
    ])
  }, ASSET_TIMEOUT_MS)
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
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300))
  })
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 300)))

  const result: Finding = { id: story.id, title: story.title, name: story.name, mode, issues: [] }
  let cell: Cell | undefined
  try {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${mode}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })
    if (!(await waitForStoryFinished(page))) result.issues.push('RENDER_TIMEOUT')
    await page.waitForTimeout(1500) // let MSW/RTK settle past skeletons

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
      await waitForAssets(page)
      const { fullscreen, clip } = await contentClip(page)
      const file = path.join(cellsDir, `${story.id}--${mode}.png`)
      // Spinners and transitions otherwise land on a different frame each run
      await page.screenshot({ path: file, fullPage: true, clip, animations: 'disabled' })
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
  const stories = Object.values(index.entries).filter(
    (e) => e.type === 'story' && (!filter || e.id.includes(filter) || e.title.includes(filter)),
  )
  console.error(`Sweeping ${stories.length} stories x ${modes.length} modes against ${base}...`)

  const browser = await launch()
  const results: Finding[] = []
  const cells: Cell[] = []
  const queue: Array<[StoryEntry, Mode]> = []
  for (const s of stories) for (const m of modes) queue.push([s, m])
  let done = 0

  async function worker(): Promise<void> {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    for (;;) {
      const item = queue.shift()
      if (!item) break
      const { finding, cell } = await checkStory(context, base, item[0], item[1], cellsDir)
      results.push(finding)
      if (cell) cells.push(cell)
      done += 1
      if (done % 50 === 0) console.error(`  ${done}/${stories.length * modes.length}`)
    }
    await context.close()
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
