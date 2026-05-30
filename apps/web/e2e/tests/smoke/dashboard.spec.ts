/**
 * Dashboard smoke tests — critical path, runs every PR.
 *
 * These are read-only tests: they verify the dashboard loads correctly
 * for a known static Safe on Sepolia staging. No mutations, no wallet.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SAFES } from '../../src/data/constants'

test.describe('Dashboard', { tag: '@smoke' }, () => {
  let homePage: HomePage

  test.beforeEach(async ({ safePage }) => {
    homePage = new HomePage(safePage)
    await homePage.goto(SAFES.SEP_STATIC_SAFE_1)
  })

  test('should load the dashboard and show Safe header info', async ({ safePage }) => {
    await homePage.waitForDashboardLoaded()
    await expect(homePage.safeHeaderInfo).toBeVisible()
  })

  test('should display the sidebar navigation', async () => {
    await expect(homePage.sidebar).toBeVisible()
  })

  test('should show connect wallet button when no wallet is connected', async () => {
    await expect(homePage.connectWalletBtn).toBeVisible()
  })
})
