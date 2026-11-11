import { chromium, type Browser, type BrowserContext } from 'playwright'

export const VIEWPORT = { width: 1280, height: 900 }
// Stories date their mock data from Date.now(); a fixed clock and time zone keep shown dates the same every day
const FIXED_NOW = new Date('2026-01-15T12:00:00Z')
const TIMEZONE = 'UTC'
// Chrome closed itself twice after about 2,700 stories in one browser; a fresh browser per 200 stories avoids that
const CONTEXTS_PER_BROWSER = 200

const LAUNCH_ARGS = [
  // GPU rasterization varies a few colour levels between runs, which changes the sheet hashes
  '--disable-gpu',
  // Chrome runs every sandboxed iframe in its own process, which can paint after the page under CI load;
  // in-process frames paint together with the page
  '--disable-features=IsolateSandboxedIframes',
  '--disable-site-isolation-trials',
  // Partial raster repaints only the changed part of a tile, so text edges depend on the order of
  // updates while a story loads; a full repaint gives the same pixels every run
  '--disable-partial-raster',
]

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

// Lazy iframes and images start loading only near the viewport, and how near depends on Chrome's heuristics
const EAGER_LOADING = `(() => {
  const setAttribute = Element.prototype.setAttribute
  Element.prototype.setAttribute = function (name, value) {
    const lazy = name === 'loading' && (this.tagName === 'IFRAME' || this.tagName === 'IMG')
    return setAttribute.call(this, name, lazy ? 'eager' : value)
  }
})()`

// Embedded apps and widgets (stake, earn, bridge) load external pages, which the sweep blocks; Chrome's
// error page for them paints at a different moment each run, so they get a fixed placeholder instead
const externalPagePlaceholder = (host: string): string =>
  `<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;background:#e5e5e5;color:#555;font:14px sans-serif">External page: ${host}</body>`

export async function launchBrowser(storybookHost: string): Promise<Browser> {
  const args = [
    ...LAUNCH_ARGS,
    // Requests from MSW's service worker are out of Playwright's reach; failing every host except the
    // swept Storybook's makes anything remote render its local fallback in every run
    `--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE ${storybookHost}`,
  ]
  try {
    // Prefer system Chrome — the repo does not ship playwright browser binaries
    return await chromium.launch({ channel: 'chrome', args })
  } catch (error) {
    // GitHub's ARM runner images have no Google Chrome
    console.error(`System Chrome did not start (${String(error).split('\n')[0]}); trying Playwright's Chromium`)
    return await chromium.launch({ args })
  }
}

/**
 * A browser context for one story: nothing (localStorage, a collapsed sidebar) carries over from the last story,
 * and the clock, Math.random, motion and external pages are the same in every run.
 */
async function newStoryContext(browser: Browser, storybookOrigin: string): Promise<BrowserContext> {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    timezoneId: TIMEZONE,
    // animations: 'disabled' only stops CSS; under reduced motion the preview also skips motion's JS animations
    reducedMotion: 'reduce',
  })
  await context.clock.setFixedTime(FIXED_NOW)
  await context.addInitScript({ content: SEEDED_RANDOM })
  await context.addInitScript({ content: EAGER_LOADING })
  await context.route(
    (url) => url.origin !== storybookOrigin,
    (route) =>
      route.request().resourceType() === 'document'
        ? route.fulfill({
            contentType: 'text/html',
            body: externalPagePlaceholder(new URL(route.request().url()).hostname),
          })
        : route.fallback(),
  )
  return context
}

/** Hands out story contexts from a browser that it replaces every CONTEXTS_PER_BROWSER contexts */
export function storyContexts(storybookUrl: URL) {
  let browser: Browser | undefined
  let handedOut = 0

  return {
    async next(): Promise<BrowserContext> {
      if (!browser || handedOut === CONTEXTS_PER_BROWSER) {
        await browser?.close()
        browser = await launchBrowser(storybookUrl.hostname)
        handedOut = 0
      }
      handedOut += 1
      return newStoryContext(browser, storybookUrl.origin)
    },
    async close(): Promise<void> {
      await browser?.close()
    },
  }
}
