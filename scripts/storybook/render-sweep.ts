/**
 * Storybook render sweep
 *
 * Loads every story headless in light + dark and flags broken renders:
 * - SB_ERROR: Storybook error display shown (missing decorator/provider, throw on mount)
 * - EMPTY_ROOT: nothing mounted into #storybook-root (NB: overlay stories that portal
 *   their content to <body> can false-positive — check before filing)
 * - BLANK_RENDER: mounted but paints no text and no visible box (missing mock data)
 * - PAGE_ERROR / CONSOLE: uncaught errors while loading
 *
 * Usage (from apps/web): yarn storybook:sweep [-- --filter=ui- --modes=light --concurrency=4]
 *   --base=<url>        Storybook to sweep (default http://localhost:6006 or $SB_BASE).
 *                       For static builds serve on a port whitelisted in OFFICIAL_HOSTS
 *                       (e.g. 4000) or host-gated pages (Imprint/Licenses) flag as blank.
 *   --filter=<substr>   Only story ids/titles containing this substring
 *   --modes=light,dark  Themes to sweep (default both)
 *   --concurrency=N     Parallel pages (default 8; static builds tolerate 10+, the
 *                       webpack dev server does not)
 *   --shots=<dir>       Also save a full-page screenshot per story+mode into <dir>
 *   --json=<file>       Write findings JSON here (default: stdout)
 *
 * Known noise under high concurrency: sporadic "Cannot read properties of undefined
 * (reading 'url')" page errors from the MSW worker lifecycle — they do not reproduce
 * interactively; ignore unless a story also flags EMPTY/BLANK.
 */

import * as fs from 'fs'
import * as path from 'path'
import { chromium, type Browser, type BrowserContext } from 'playwright'

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

async function launch(): Promise<Browser> {
  try {
    // Prefer system Chrome — the repo does not ship playwright browser binaries
    return await chromium.launch({ channel: 'chrome' })
  } catch {
    return await chromium.launch()
  }
}

async function checkStory(context: BrowserContext, base: string, story: StoryEntry, mode: Mode): Promise<Finding> {
  const page = await context.newPage()
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text().slice(0, 300))
  })
  page.on('pageerror', (err) => pageErrors.push(String(err).slice(0, 300)))

  const result: Finding = { id: story.id, title: story.title, name: story.name, mode, issues: [] }
  try {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${mode}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    })
    await page
      .waitForFunction(
        () => {
          const root = document.querySelector('#storybook-root')
          const ready =
            document.body.classList.contains('sb-show-main') &&
            !document.querySelector('.sb-preparing-story, .sb-loader') &&
            root !== null &&
            root.childNodes.length > 0
          return ready || document.body.classList.contains('sb-show-errordisplay')
        },
        { timeout: 20000 },
      )
      .catch(() => {})
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

    const args = parseArgs()
    // 'skip-visual-test' marks flaky/animated/interactive-only stories that must not be
    // pixel-snapshotted (successor of the Chromatic-era '!chromatic' negation tag, which
    // never reached index.json). They are still render-checked — only the screenshot is skipped.
    const skipSnapshot = story.tags?.includes('skip-visual-test')
    if (typeof args.shots === 'string' && !skipSnapshot) {
      fs.mkdirSync(args.shots, { recursive: true })
      await page.screenshot({ path: path.join(args.shots, `${story.id}--${mode}.png`), fullPage: true })
    }
  } catch (err) {
    result.issues.push(`NAV_FAIL: ${String(err).slice(0, 200)}`)
  } finally {
    await page.close()
  }
  return result
}

async function main(): Promise<void> {
  const args = parseArgs()
  const base = (typeof args.base === 'string' && args.base) || process.env.SB_BASE || 'http://localhost:6006'
  const modes: Mode[] = (typeof args.modes === 'string' ? args.modes : 'light,dark').split(',')
  const concurrency = Number(args.concurrency) || 8
  const filter = typeof args.filter === 'string' ? args.filter : ''

  const index = (await (await fetch(`${base}/index.json`)).json()) as { entries: Record<string, StoryEntry> }
  const stories = Object.values(index.entries).filter(
    (e) => e.type === 'story' && (!filter || e.id.includes(filter) || e.title.includes(filter)),
  )
  console.error(`Sweeping ${stories.length} stories x ${modes.length} modes against ${base}...`)

  const browser = await launch()
  const results: Finding[] = []
  const queue: Array<[StoryEntry, Mode]> = []
  for (const s of stories) for (const m of modes) queue.push([s, m])
  let done = 0

  async function worker(): Promise<void> {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    for (;;) {
      const item = queue.shift()
      if (!item) break
      results.push(await checkStory(context, base, item[0], item[1]))
      done += 1
      if (done % 50 === 0) console.error(`  ${done}/${stories.length * modes.length}`)
    }
    await context.close()
  }

  await Promise.all(Array.from({ length: concurrency }, worker))
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
