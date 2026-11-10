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
 * - EXTERNAL_REQUEST: an API call had no MSW mock and hit the (blocked) network
 * - NAV_FAIL: the story page could not be opened or checked
 *
 * Usage (from apps/web): yarn storybook:sweep [-- --filter=ui- --modes=light --concurrency=4]
 *   --base=<url>        Storybook to sweep (default http://localhost:6006 or $SB_BASE).
 *                       For static builds serve on a port whitelisted in OFFICIAL_HOSTS
 *                       (e.g. 4000) or host-gated pages (Imprint/Licenses) flag as blank.
 *   --filter=<substr>   Only story ids/titles containing this substring (comma-separated: any of them)
 *   --modes=light,dark  Themes to sweep (default both)
 *   --shard=k/n         Only sweep shard k of n; whole titles per shard (see shardStories)
 *   --concurrency=N     Parallel pages (default 8; static builds tolerate 10+, the
 *                       webpack dev server does not)
 *   --shots=<dir>       Also save screenshots into <dir> as sheets (see sheets.ts): one image per
 *                       title with every story x mode, and one per fullscreen (page) story
 *   --manifest=<file>   With --shots: also write { sheet file: sha256 } here (see diff-manifest.ts)
 *   --json=<file>       Write findings JSON here (default: stdout)
 *
 * The parts: sweep-options.ts (command line), sweep-browser.ts (browser and per-story context),
 * sweep-check.ts (one story), sweep-settle.ts (waiting for a stable screenshot), sweep-findings.ts (issues).
 */

import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { pathToFileURL } from 'url'
import type { Browser } from 'playwright'
import { hashImage, type Manifest } from './manifest'
import { planSheets, shardStories, sheetHtml, type Cell, type Sheet } from './sheets'
import { launchBrowser, storyContexts } from './sweep-browser'
import { checkStory } from './sweep-check'
import { hasBrokenStory, type Finding } from './sweep-findings'
import { parseOptions, selectStories, type Mode, type StoryEntry, type SweepOptions } from './sweep-options'

const SHEET_WORKERS = 4
const PROGRESS_EVERY = 50

async function loadStories(options: SweepOptions): Promise<StoryEntry[]> {
  const response = await fetch(`${options.base}/index.json`)
  const index = (await response.json()) as { entries: Record<string, StoryEntry> }
  const matching = selectStories(Object.values(index.entries), options.filters)
  return shardStories(matching, options.shard, options.shardCount)
}

/** Checks every story x mode with `concurrency` workers, each with its own browser */
async function sweepStories(
  stories: StoryEntry[],
  options: SweepOptions,
  cellsDir: string | undefined,
): Promise<{ findings: Finding[]; cells: Cell[] }> {
  const queue: Array<[StoryEntry, Mode]> = stories.flatMap((story) =>
    options.modes.map((mode): [StoryEntry, Mode] => [story, mode]),
  )
  const total = queue.length
  const findings: Finding[] = []
  const cells: Cell[] = []

  async function worker(): Promise<void> {
    const contexts = storyContexts(new URL(options.base))
    for (let item = queue.shift(); item; item = queue.shift()) {
      const context = await contexts.next()
      const { finding, cell } = await checkStory(context, item[0], item[1], {
        storybook: options.base,
        cellsDir,
      }).finally(() => context.close())
      findings.push(finding)
      if (cell) cells.push(cell)
      if (findings.length % PROGRESS_EVERY === 0) console.error(`  ${findings.length}/${total}`)
    }
    await contexts.close()
  }

  await Promise.all(Array.from({ length: options.concurrency }, worker))
  return { findings, cells }
}

/** Renders each sheet's HTML (see sheets.ts) and saves its screenshot into shotsDir */
async function writeSheets(
  browser: Browser,
  sheets: Sheet[],
  modes: Mode[],
  cellsDir: string,
  shotsDir: string,
): Promise<void> {
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
  await Promise.all(Array.from({ length: SHEET_WORKERS }, worker))
}

function writeManifest(sheets: Sheet[], shotsDir: string, manifestFile: string): void {
  const manifest: Manifest = Object.fromEntries(
    sheets.map((sheet) => [sheet.file, hashImage(fs.readFileSync(path.join(shotsDir, sheet.file)))]),
  )
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 1))
  console.error(`Wrote the hashes of ${sheets.length} sheets to ${manifestFile}`)
}

function writeReport(findings: Finding[], jsonFile: string | undefined): void {
  const bad = findings.filter((finding) => finding.issues.length)
  const report = JSON.stringify({ total: findings.length, bad: bad.length, findings: bad }, null, 1)
  if (jsonFile) {
    fs.writeFileSync(jsonFile, report)
    console.error(`Wrote ${bad.length} findings to ${jsonFile}`)
  } else {
    console.log(report)
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2), process.env)
  const stories = await loadStories(options)
  console.error(
    `Sweeping ${stories.length} stories x ${options.modes.length} modes ` +
      `(shard ${options.shard}/${options.shardCount}) against ${options.base}...`,
  )

  const cellsDir = options.shotsDir ? fs.mkdtempSync(path.join(os.tmpdir(), 'sb-cells-')) : undefined
  const { findings, cells } = await sweepStories(stories, options, cellsDir)

  if (options.shotsDir && cellsDir) {
    const sheets = planSheets(
      cells,
      stories.map((story) => story.id),
      options.modes,
    )
    // The same launch flags as the stories, so sheets rasterize the same way in every run
    const browser = await launchBrowser(new URL(options.base).hostname)
    await writeSheets(browser, sheets, options.modes, cellsDir, options.shotsDir).finally(() => browser.close())
    fs.rmSync(cellsDir, { recursive: true, force: true })
    console.error(`Wrote ${sheets.length} sheets from ${cells.length} screenshots to ${options.shotsDir}`)
    if (options.manifestFile) writeManifest(sheets, options.shotsDir, options.manifestFile)
  }

  writeReport(findings, options.jsonFile)
  process.exitCode = hasBrokenStory(findings) ? 1 : 0
}

void main()
