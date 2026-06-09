/**
 * One-shot clickthrough — Dashboard happy path.
 *
 * A read-only, wallet-free end-to-end walkthrough of the core dashboard
 * experience for a known static Safe on Sepolia staging. Intended to be run
 * against a deployed PR preview; produces a video recording on every run
 * (pass or fail) for PR commentary.
 *
 * Tag: @one-shot — runs only under the "one-shots" Playwright project.
 * No mutations, no wallet connection required.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SAFES, ROUTES } from '../../src/data/constants'

test.describe('Dashboard clickthrough', { tag: '@one-shot' }, () => {
  let homePage: HomePage

  test.beforeEach(async ({ safePage }) => {
    homePage = new HomePage(safePage)
    await homePage.goto(SAFES.SEP_STATIC_SAFE_1)
  })

  test('should load the dashboard with Safe header and sidebar visible', async ({ safePage }) => {
    await homePage.waitForDashboardLoaded()
    await expect(homePage.safeHeaderInfo).toBeVisible()
    await expect(homePage.sidebar).toBeVisible()
  })

  test('should show the connect wallet button when no wallet is connected', async () => {
    await expect(homePage.connectWalletBtn).toBeVisible()
  })

  test('should navigate to the balances page and return to dashboard', async ({ safePage }) => {
    await homePage.waitForDashboardLoaded()

    // Navigate to balances via the URL — stays read-only, no wallet needed
    await safePage.goto(`${ROUTES.balances}?safe=${SAFES.SEP_STATIC_SAFE_1}`)
    await expect(safePage).toHaveURL(new RegExp(ROUTES.balances))

    // Sidebar navigation remains visible throughout
    await expect(homePage.sidebar).toBeVisible()

    // Navigate back to the dashboard
    await safePage.goto(`${ROUTES.home}?safe=${SAFES.SEP_STATIC_SAFE_1}`)
    await homePage.waitForDashboardLoaded()
    await expect(homePage.safeHeaderInfo).toBeVisible()
  })
})
