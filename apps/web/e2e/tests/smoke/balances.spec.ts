/**
 * Balances hybrid tests — API setup + UI verification.
 *
 * Pattern: fetch expected data from CGW API, then verify the UI renders it.
 * This is the recommended approach for data-display pages.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { AssetsPage } from '../../src/pages/assets.page'
import { SAFES, ROUTES, DUST_THRESHOLD_USD } from '../../src/data/constants'

const safeAddress = SAFES.SEP_STATIC_SAFE_1.split(':')[1]
const assetsSafeAddress = SAFES.SEP_ASSETS_SAFE.split(':')[1]

test.describe('Balances page', { tag: '@smoke' }, () => {
  test('should display token balances matching API data', async ({ safePage, safeApiClient }) => {
    // 1. API: get expected balances
    const balances = await safeApiClient.getBalances(safeAddress)

    // Precondition: test Safe must have tokens — fail fast if test data is broken
    expect(balances.items.length).toBeGreaterThan(0)

    // 2. UI: navigate to balances page
    await safePage.goto(`${ROUTES.balances}?safe=${SAFES.SEP_STATIC_SAFE_1}`)

    // 3. Verify: UI shows the first token symbol from API.
    // Matched on the symbol cell's own testid rather than by text: `getByText` is a case-insensitive
    // substring match, so "ETH" also hits the amount ("0.1 ETH") and the token name ("Sepolia Ether")
    // and trips strict mode with three results.
    await expect(safePage.getByTestId('token-symbol').first()).toHaveText(balances.items[0].tokenInfo.symbol)
  })

  test(
    'should list every token in both token-list modes when small balances are shown and only tokens above the dust threshold when they are hidden',
    { tag: '@migration' },
    async ({ safePage, safeApiClient }) => {
      const balances = await safeApiClient.getBalances(assetsSafeAddress)
      const aboveDust = balances.items.filter((item) => Number(item.fiatBalance) >= DUST_THRESHOLD_USD)
      const dust = balances.items.filter((item) => Number(item.fiatBalance) < DUST_THRESHOLD_USD)
      // Precondition: the filter is only observable when the Safe holds tokens on both sides of the threshold.
      expect(aboveDust.length).toBeGreaterThan(0)
      expect(dust.length).toBeGreaterThan(0)

      const assets = new AssetsPage(safePage)
      await assets.goto(SAFES.SEP_ASSETS_SAFE)
      await expect(assets.tokenRows.first()).toBeVisible()

      // Sepolia has no portfolio endpoint, so the app disables trusted-token filtering there and
      // "Default tokens" shows the same list as "All tokens".
      await assets.setHideSmallBalances(false)
      await assets.setShowAllTokens(false)
      await expect(assets.tokenRows).toHaveCount(balances.items.length)
      for (const item of balances.items) {
        await expect(assets.rowForSymbol(item.tokenInfo.symbol)).toBeVisible()
      }

      await assets.setShowAllTokens(true)
      await expect(assets.tokenRows).toHaveCount(balances.items.length)

      await assets.setHideSmallBalances(true)
      await expect(assets.tokenRows).toHaveCount(aboveDust.length)
      for (const item of aboveDust) {
        await expect(assets.rowForSymbol(item.tokenInfo.symbol)).toBeVisible()
      }
      for (const item of dust) {
        await expect(assets.rowForSymbol(item.tokenInfo.symbol)).toHaveCount(0)
      }
    },
  )
})
