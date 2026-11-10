import * as fs from 'fs'
import * as path from 'path'
import type { BrowserContext, Page } from 'playwright'
import type { Cell } from './sheets'
import type { Mode, StoryEntry } from './sweep-options'
import {
  emptyFinding,
  isReportableConsoleError,
  MESSAGE_LENGTH,
  MIN_VISIBLE_HEIGHT,
  renderIssues,
  truncate,
  type Finding,
  type RenderState,
} from './sweep-findings'
import {
  stableScreenshot,
  trackRequests,
  waitForAssets,
  waitForQuietNetwork,
  waitForStoryFinished,
  type RequestTracker,
} from './sweep-settle'

const NAVIGATION_TIMEOUT_MS = 60000
const TEXT_SAMPLE_LENGTH = 120
const NAV_FAIL_MESSAGE_LENGTH = 200
// 'skip-visual-test' marks flaky/animated/interactive-only stories that must not be pixel-snapshotted
// (successor of the Chromatic-era '!chromatic' negation tag, which never reached index.json).
// They are still render-checked — only the screenshot is skipped.
const SKIP_SNAPSHOT_TAG = 'skip-visual-test'

export interface StoryRun {
  storybook: string
  /** Where screenshots go; without it, the story is only render-checked */
  cellsDir?: string
}

function collectErrors(page: Page, storybook: string): { pageErrors: string[]; consoleErrors: string[] } {
  const pageErrors: string[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(truncate(String(error))))
  page.on('console', (message) => {
    if (message.type() === 'error' && isReportableConsoleError(message.text(), message.location().url, storybook)) {
      consoleErrors.push(truncate(message.text()))
    }
  })
  return { pageErrors, consoleErrors }
}

function inspectRender(page: Page): Promise<RenderState> {
  return page.evaluate(
    ({ sampleLength, enoughHeight, messageLength }) => {
      const root = document.querySelector('#storybook-root')
      const text = root ? (root as HTMLElement).innerText.replace(/\s+/g, ' ').trim() : ''
      // Stops at the first box taller than a line: enough to tell an empty render from a real one
      let visibleHeight = 0
      if (root) {
        for (const el of root.querySelectorAll('*')) {
          visibleHeight = Math.max(visibleHeight, el.getBoundingClientRect().height)
          if (visibleHeight > enoughHeight) break
        }
      }
      return {
        sbError: document.body.classList.contains('sb-show-errordisplay'),
        errorMessage: document.querySelector('#error-message')?.textContent?.slice(0, messageLength) || '',
        empty: !root || root.childNodes.length === 0,
        textLength: text.length,
        textSample: text.slice(0, sampleLength),
        visibleHeight,
      }
    },
    { sampleLength: TEXT_SAMPLE_LENGTH, enoughHeight: MIN_VISIBLE_HEIGHT, messageLength: MESSAGE_LENGTH },
  )
}

async function captureCell(
  page: Page,
  requests: RequestTracker,
  story: StoryEntry,
  mode: Mode,
  cellsDir: string,
): Promise<{ cell: Cell; issues: string[] }> {
  const issues: string[] = []
  await waitForAssets(page)
  const { fullscreen, png, stable } = await stableScreenshot(page, requests)
  if (!stable) issues.push('UNSTABLE_SCREENSHOT')
  const file = path.join(cellsDir, `${story.id}--${mode}.png`)
  fs.writeFileSync(file, png)
  return { cell: { storyId: story.id, name: story.name, mode, file, fullscreen }, issues }
}

/** Renders one story in one mode, records what went wrong and, with a cellsDir, takes its screenshot */
export async function checkStory(
  context: BrowserContext,
  story: StoryEntry,
  mode: Mode,
  run: StoryRun,
): Promise<{ finding: Finding; cell?: Cell }> {
  const page = await context.newPage()
  const errors = collectErrors(page, run.storybook)
  const requests = trackRequests(page, new URL(run.storybook).origin)
  const finding = emptyFinding(story, mode)
  let cell: Cell | undefined
  try {
    await page.goto(`${run.storybook}/iframe.html?id=${story.id}&viewMode=story&globals=theme:${mode}`, {
      waitUntil: 'domcontentloaded',
      timeout: NAVIGATION_TIMEOUT_MS,
    })
    if (!(await waitForStoryFinished(page))) finding.issues.push('RENDER_TIMEOUT')
    await waitForQuietNetwork(page, requests)

    const state = await inspectRender(page)
    finding.issues.push(...renderIssues(state, { ...errors, externalCalls: [...requests.externalCalls] }))
    finding.textSample = state.textSample

    if (run.cellsDir && !story.tags?.includes(SKIP_SNAPSHOT_TAG)) {
      const captured = await captureCell(page, requests, story, mode, run.cellsDir)
      finding.issues.push(...captured.issues)
      cell = captured.cell
    }
  } catch (error) {
    finding.issues.push(`NAV_FAIL: ${String(error).slice(0, NAV_FAIL_MESSAGE_LENGTH)}`)
  } finally {
    await page.close()
  }
  return { finding, cell }
}
