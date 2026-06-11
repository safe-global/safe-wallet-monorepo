/**
 * One-shot clickthrough — topbar / sub-header sticky layering (WA-2552).
 *
 * Asserts the layering contract between the topbar and page sub-headers,
 * purely geometrically (boundingBox + elementFromPoint hit-testing — no
 * pixel comparison):
 *
 * 1. Browsing a scrolled settings page: the settings tabs pin to the viewport
 *    top, the topbar has scrolled away.
 * 2. Opening a tx flow from that scrolled state: the elevated topbar pins to
 *    the viewport top and paints OVER everything in the top strip — the
 *    settings tabs must not be hit-testable anywhere.
 * 3. Closing the flow restores the browsing state (tabs pinned again).
 * 4. Browsing a scrolled Safe Apps page: the apps tabs + search pin to the
 *    top, the topbar has scrolled away.
 *
 * The viewport is pinned to 1280×800: small enough that the settings page
 * scrolls, wide enough to stay clear of the 900–1148px topbar wrap zone.
 *
 * Not covered (manual only): macOS trackpad rubber-band overscroll revealing
 * the page behind the dialog — elastic scrolling happens in the OS compositor
 * and cannot be reproduced in (headless) Playwright. The CSS guards for it
 * (`overscroll-behavior: none`, opaque dialog root) are asserted as computed
 * styles instead.
 *
 * Tag: @one-shot — runs only under the "one-shots" Playwright project.
 * Requires CYPRESS_WALLET_CREDENTIALS (same secret the Cypress suite uses).
 */
import { test, expect, type Page } from '../../src/fixtures/test.fixture'
import { SAFES } from '../../src/data/constants'

test.use({ viewport: { width: 1280, height: 800 } })

// The connected signer must own this Safe so the tx-flow triggers are enabled.
// Defaults to the shared static Safe owned by the CI credentials; override for
// local runs against a dev-env Safe (LAYERING_TEST_SAFE=sep:0x...).
const TEST_SAFE = process.env.LAYERING_TEST_SAFE || SAFES.SEP_STATIC_SAFE_2

/** y of the element's top edge, or null when it has no box */
const topOf = async (page: Page, selector: string): Promise<number | null> => {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    return el ? el.getBoundingClientRect().top : null
  }, selector)
}

/** Whether the topmost element painted at (x, y) lies inside `containerSelector` */
const hitIsInside = async (page: Page, x: number, y: number, containerSelector: string): Promise<boolean> => {
  return page.evaluate(({ x, y, sel }) => !!document.elementFromPoint(x, y)?.closest(sel), {
    x,
    y,
    sel: containerSelector,
  })
}

const TOPBAR = 'header' // the banner landmark rendered by the Topbar
const TABLIST = '[role="tablist"]' // settings / apps sub-header tabs

test.describe('Topbar layering', { tag: '@one-shot' }, () => {
  test('sub-headers pin while browsing, elevated topbar covers them in a tx flow', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    // Opt into classic view so the require-login gate doesn't redirect the
    // settings route to the workspace login (same opt-in a user makes via
    // "Use the old UI").
    await safePage.addInitScript(() => {
      window.sessionStorage.setItem('SAFE_v2__classicViewEnabled', 'true')
    })

    // --- Setup: connect the owner wallet so tx-flow triggers are enabled.
    await safePage.goto(`/settings/setup?safe=${TEST_SAFE}`)
    await walletPage.acceptCookies()
    // The classic-view deprecation toast floats top-right and intercepts
    // clicks aimed at the dialog's close button; it (re)appears on route and
    // wallet events, so dismiss it on demand right before sensitive clicks.
    const deprecationToast = safePage.locator('.MuiAlert-root', { hasText: 'Classic view will be deprecated' })
    const dismissDeprecationToast = async () => {
      if (await deprecationToast.isVisible().catch(() => false)) {
        // While a modal is open MUI sets aria-hidden on #__next, hiding the
        // toast from the a11y tree — locate by CSS and force the click.
        await deprecationToast.locator('button').click({ force: true })
        await expect(deprecationToast).not.toBeVisible()
      }
    }
    await dismissDeprecationToast()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toBeVisible()

    const spendingLimitBtn = safePage.getByRole('button', { name: 'New spending limit', exact: true })
    await expect(spendingLimitBtn).toBeEnabled()

    // --- 1. Browsing mode, scrolled: tabs pinned at top, topbar scrolled away.
    await spendingLimitBtn.scrollIntoViewIfNeeded()
    expect(await safePage.evaluate(() => window.scrollY)).toBeGreaterThan(200)

    // settings tabs pinned in the top strip (sticky offset overlaps slightly negative)
    await expect.poll(() => topOf(safePage, TABLIST)).toBeLessThan(60)
    await expect.poll(() => topOf(safePage, TABLIST)).toBeGreaterThan(-60)
    // topbar entirely above the viewport
    expect(
      await safePage.evaluate(() => document.querySelector('header')!.getBoundingClientRect().bottom),
    ).toBeLessThanOrEqual(0)

    // --- 2. Tx flow opened from the scrolled state: topbar pins and covers the strip.
    await spendingLimitBtn.click()
    await expect(safePage.getByTestId('modal-title')).toBeVisible()

    // topbar pinned to the viewport top (settle the 225ms open transition)
    await expect.poll(() => topOf(safePage, TOPBAR)).toBe(0)
    // the top strip paints the topbar — sample across the full width
    for (const x of [100, 640, 1180]) {
      expect(await hitIsInside(safePage, x, 30, TOPBAR)).toBe(true)
      // and specifically NOT the settings tabs
      expect(await hitIsInside(safePage, x, 30, TABLIST)).toBe(false)
    }
    // the dialog guards against elastic overscroll revealing the page behind it
    const guards = await safePage.evaluate(() => {
      const container = document.querySelector('.MuiDialog-container')!
      const root = document.querySelector('.MuiDialog-root')!
      return {
        overscroll: getComputedStyle(container).overscrollBehavior,
        rootBg: getComputedStyle(root).backgroundColor,
      }
    })
    expect(guards.overscroll).toBe('none')
    expect(guards.rootBg).not.toBe('rgba(0, 0, 0, 0)') // opaque, not transparent

    // --- 3. Closing restores browsing mode (confirm() guard auto-accepted).
    safePage.once('dialog', (dialog) => dialog.accept())
    // Programmatic click: assorted notification toasts float over the close
    // button's hit area and are not what this test is about.
    await safePage.locator('[role="dialog"] [aria-label="close"]').dispatchEvent('click')
    await expect(safePage.getByTestId('modal-title')).not.toBeVisible()
    expect(await safePage.evaluate(() => window.scrollY)).toBeGreaterThan(200) // scroll position kept
    await expect.poll(() => topOf(safePage, TABLIST)).toBeLessThan(60) // tabs pinned again

    // --- 4. Safe Apps page, scrolled: apps tabs + search pinned, topbar away.
    await safePage.goto(`/apps?safe=${TEST_SAFE}`)
    await expect(safePage.getByRole('tab', { name: 'All apps' })).toBeVisible()
    await safePage.evaluate(() => window.scrollTo(0, 800))
    expect(await safePage.evaluate(() => window.scrollY)).toBeGreaterThan(400)

    await expect.poll(() => topOf(safePage, TABLIST)).toBeLessThan(60)
    await expect(safePage.getByPlaceholder('Search by name or category')).toBeVisible()
    expect(
      await safePage.evaluate(() => document.querySelector('header')!.getBoundingClientRect().bottom),
    ).toBeLessThanOrEqual(0)
  })
})
