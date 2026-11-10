import type { Page } from 'playwright'
import { STORY_FINISHED } from 'storybook/internal/core-events'
import { externalCallOf } from './sweep-findings'
import { VIEWPORT } from './sweep-browser'

declare global {
  interface Window {
    __STORYBOOK_ADDONS_CHANNEL__?: { last: (eventName: string) => unknown }
  }
}

const STORY_FINISHED_TIMEOUT_MS = 30000
// Settling: no open request for QUIET_MS, then two identical screenshots QUIET_MS apart.
// Loading-state stories hold a request open (MSW delay('infinite')), so both waits are capped.
const QUIET_MS = 100
const POLL_MS = QUIET_MS / 4
const NETWORK_SETTLE_TIMEOUT_MS = 3000
// Pages with dozens of icon iframes kept painting for seconds on slow CI runners; a still-changing
// screenshot is kept only after this
const SCREENSHOT_SETTLE_TIMEOUT_MS = 10000
const ASSET_TIMEOUT_MS = 5000
const MAX_VIEWPORT_HEIGHT = 8000
// Room around a padded story's content in its screenshot
const CLIP_PADDING = 8

interface Clip {
  x: number
  y: number
  width: number
  height: number
}

export interface RequestTracker {
  openCount: () => number
  externalCalls: Set<string>
}

/**
 * Counts the page's open requests (MSW answers from a service worker, and Playwright still reports those)
 * and records API calls that reached the blocked network.
 */
export function trackRequests(page: Page, storybookOrigin: string): RequestTracker {
  let open = 0
  const externalCalls = new Set<string>()
  page.on('request', () => open++)
  page.on('requestfinished', () => open--)
  page.on('requestfailed', (request) => {
    open--
    const call = externalCallOf(request.url(), request.resourceType(), storybookOrigin)
    if (call) externalCalls.add(call)
  })
  return { openCount: () => open, externalCalls }
}

// STORY_FINISHED is emitted after the play function, the animation wait and afterEach.
export async function waitForStoryFinished(page: Page): Promise<boolean> {
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

export async function waitForQuietNetwork(page: Page, requests: RequestTracker): Promise<void> {
  const deadline = Date.now() + NETWORK_SETTLE_TIMEOUT_MS
  let quietSince = Date.now()
  while (Date.now() < deadline) {
    if (requests.openCount() > 0) quietSince = Date.now()
    else if (Date.now() - quietSince >= QUIET_MS) return
    await page.waitForTimeout(POLL_MS)
  }
}

// An iframe keeps its empty about:blank document until Chrome loads its srcdoc, so under load an
// iframe can have no image yet when the asset wait below looks inside it.
async function waitForSrcdocFrames(page: Page): Promise<void> {
  const deadline = Date.now() + ASSET_TIMEOUT_MS
  for (;;) {
    const blank = page.frames().filter((frame) => frame.url() === 'about:blank' && frame !== page.mainFrame())
    const pending = await Promise.all(
      blank.map((frame) =>
        frame
          .frameElement()
          .then((element) => element.getAttribute('srcdoc'))
          .then((srcdoc) => srcdoc !== null)
          .catch(() => false),
      ),
    )
    if (!pending.includes(true) || Date.now() > deadline) return
    await page.waitForTimeout(POLL_MS)
  }
}

/** Fonts and images that are still loading make the screenshot differ between runs */
export async function waitForAssets(page: Page): Promise<void> {
  // Embedded pages paint only once their frame has loaded
  await Promise.all(
    page.frames().map((frame) => frame.waitForLoadState('load', { timeout: ASSET_TIMEOUT_MS }).catch(() => undefined)),
  )
  await waitForSrcdocFrames(page)
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

/** Frames whose image has not finished loading; a broken image counts as finished */
export async function countPendingImageFrames(page: Page): Promise<number> {
  const pending = await Promise.all(
    page
      .frames()
      .filter((frame) => frame !== page.mainFrame())
      .map((frame) => frame.evaluate(() => [...document.images].some((img) => !img.complete)).catch(() => false)),
  )
  return pending.filter(Boolean).length
}

const isFullscreen = (page: Page): Promise<boolean> =>
  page.evaluate(() => document.body.classList.contains('sb-main-fullscreen'))

const pageHeight = (page: Page): Promise<number> => page.evaluate(() => document.documentElement.scrollHeight)

async function resizeViewport(page: Page, height: number, requests: RequestTracker): Promise<void> {
  await page.setViewportSize({ width: VIEWPORT.width, height })
  await waitForQuietNetwork(page, requests)
}

/**
 * A full-page story gets a viewport as tall as the page, like a user with a very tall window: the fixed sidebar
 * then spans the whole sheet instead of stopping at 900px. A screen-sized layout (min-h-screen, 100vh) grows
 * with the viewport instead, so it keeps the default height, as a user sees it. Returns whether it resized.
 */
async function fitFullscreenViewport(page: Page, requests: RequestTracker): Promise<boolean> {
  const contentHeight = await pageHeight(page)
  if (contentHeight <= VIEWPORT.height) return false
  const height = Math.min(contentHeight, MAX_VIEWPORT_HEIGHT)
  await resizeViewport(page, height, requests)
  if ((await pageHeight(page)) > height) await page.setViewportSize(VIEWPORT)
  return true
}

/**
 * Chrome leaves iframes below the viewport blank in a full-page screenshot, so a padded story's viewport
 * reaches its lowest iframe. It follows the final layout in both directions. Returns whether it resized.
 */
async function fitViewportToIframes(page: Page, requests: RequestTracker): Promise<boolean> {
  const lowestIframe = await page.evaluate(() =>
    Math.max(0, ...[...document.querySelectorAll('iframe')].map((f) => f.getBoundingClientRect().bottom + scrollY)),
  )
  const height = Math.min(Math.max(VIEWPORT.height, Math.ceil(lowestIframe)), MAX_VIEWPORT_HEIGHT)
  if (page.viewportSize()?.height === height) return false
  await resizeViewport(page, height, requests)
  return true
}

// Padded/centered stories are clipped to their content, portals (dialogs, popovers) included.
// Fullscreen stories and the error display keep the whole page.
async function contentClip(page: Page): Promise<{ fullscreen: boolean; clip?: Clip }> {
  return page.evaluate((pad) => {
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
  }, CLIP_PADDING)
}

/**
 * Takes screenshots until two in a row are identical: re-renders after data arrives (or timers in app code)
 * would otherwise be caught half-way. Before each one, the viewport is fitted to the current layout, since a
 * page that is still growing (slow CI runners) can push iframes below the viewport after the first fit.
 */
export async function stableScreenshot(
  page: Page,
  requests: RequestTracker,
): Promise<{ fullscreen: boolean; png: Buffer; stable: boolean }> {
  const deadline = Date.now() + SCREENSHOT_SETTLE_TIMEOUT_MS
  const fullscreen = await isFullscreen(page)
  // A full-page story is fitted once: refitting a screen-sized layout would grow it on every pass
  let fullscreenFitted = false
  let previous: Buffer | undefined
  for (;;) {
    let resized = false
    if (fullscreen && !fullscreenFitted) {
      fullscreenFitted = true
      resized = await fitFullscreenViewport(page, requests)
    } else if (!fullscreen) {
      resized = await fitViewportToIframes(page, requests)
    }
    if (resized) {
      await waitForAssets(page)
      previous = undefined
    }
    const { clip } = await contentClip(page)
    // Spinners and transitions otherwise land on a different frame each run
    const png = await page.screenshot({ fullPage: true, clip, animations: 'disabled' })
    const stable = previous !== undefined && png.equals(previous)
    if (stable || Date.now() > deadline) return { fullscreen, png, stable }
    previous = png
    await page.waitForTimeout(QUIET_MS)
  }
}
