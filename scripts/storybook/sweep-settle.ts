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

/** Fonts and images that are still loading make the screenshot differ between runs */
export async function waitForAssets(page: Page): Promise<void> {
  // Embedded pages paint only once their frame has loaded
  await Promise.all(
    page.frames().map((frame) => frame.waitForLoadState('load', { timeout: ASSET_TIMEOUT_MS }).catch(() => undefined)),
  )
  // Each frame has its own document, so wait inside every frame
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
async function contentClip(page: Page): Promise<{ fullscreen: boolean; clip?: Clip; inViewport?: boolean }> {
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
    const width = Math.ceil(right + window.scrollX + pad) - x
    const height = Math.ceil(bottom + window.scrollY + pad) - y
    const unscrolled = window.scrollX === 0 && window.scrollY === 0
    return {
      fullscreen,
      clip: { x, y, width, height },
      inViewport: unscrolled && x + width <= window.innerWidth && y + height <= window.innerHeight,
    }
  }, CLIP_PADDING)
}

/**
 * Where two screenshots differ, as "x=a-b y=c-d" in screenshot pixels, so an unstable story's finding names the
 * part of the page that kept changing. The page decodes both, as Node has no PNG decoder here.
 */
export async function changedArea(page: Page, before: Buffer, after: Buffer): Promise<string> {
  return page.evaluate(
    async ([a, b]) => {
      // No named helpers in here: tsx wraps them in a __name() call that does not exist in the page.
      const images = [new Image(), new Image()]
      images[0].src = `data:image/png;base64,${a}`
      images[1].src = `data:image/png;base64,${b}`
      await Promise.all(images.map((image) => image.decode()))
      const [first, second] = images
      if (first.width !== second.width || first.height !== second.height) {
        return `size ${first.width}x${first.height} -> ${second.width}x${second.height}`
      }
      const pixels = images.map((image) => {
        const canvas = document.createElement('canvas')
        canvas.width = image.width
        canvas.height = image.height
        const context = canvas.getContext('2d', { willReadFrequently: true })!
        context.drawImage(image, 0, 0)
        return context.getImageData(0, 0, image.width, image.height).data
      })
      let [left, top, right, bottom] = [Infinity, Infinity, -1, -1]
      for (let y = 0; y < first.height; y++) {
        for (let x = 0; x < first.width; x++) {
          const i = (y * first.width + x) * 4
          if (
            pixels[0][i] !== pixels[1][i] ||
            pixels[0][i + 1] !== pixels[1][i + 1] ||
            pixels[0][i + 2] !== pixels[1][i + 2]
          ) {
            left = Math.min(left, x)
            top = Math.min(top, y)
            right = Math.max(right, x)
            bottom = Math.max(bottom, y)
          }
        }
      }
      return right < 0 ? 'no pixel change' : `x=${left}-${right} y=${top}-${bottom}`
    },
    [before.toString('base64'), after.toString('base64')],
  )
}

/**
 * Takes screenshots until two in a row are identical: re-renders after data arrives (or timers in app code)
 * would otherwise be caught half-way. For a padded story, the viewport is fitted to the current layout before
 * each one, since a page that is still growing (slow CI runners) can push iframes below the viewport.
 */
export async function stableScreenshot(
  page: Page,
  requests: RequestTracker,
): Promise<{ fullscreen: boolean; png: Buffer; stable: boolean; change?: string }> {
  const deadline = Date.now() + SCREENSHOT_SETTLE_TIMEOUT_MS
  const fullscreen = await isFullscreen(page)
  // A full-page story is fitted once, after it settles at the default height: an earlier fit can measure a
  // page that is still loading, and refitting a screen-sized layout would grow it on every pass
  let fullscreenFitted = !fullscreen
  let previous: Buffer | undefined
  for (;;) {
    if (!fullscreen && (await fitViewportToIframes(page, requests))) {
      await waitForAssets(page)
      previous = undefined
    }
    const { clip, inViewport } = await contentClip(page)
    // A full-page capture resizes the viewport for a moment, and popups reposition on that resize (a combobox
    // list flips above its input), so content that fits is captured as it is shown.
    // Spinners and transitions otherwise land on a different frame each run.
    const png = await page.screenshot({ fullPage: !inViewport, clip, animations: 'disabled' })
    const stable = previous !== undefined && png.equals(previous)
    if (stable && !fullscreenFitted) {
      fullscreenFitted = true
      if (await fitFullscreenViewport(page, requests)) {
        await waitForAssets(page)
        previous = undefined
        continue
      }
    }
    if (stable) return { fullscreen, png, stable }
    if (Date.now() > deadline) {
      const change = previous ? await changedArea(page, previous, png) : undefined
      return { fullscreen, png, stable, change }
    }
    previous = png
    await page.waitForTimeout(QUIET_MS)
  }
}
