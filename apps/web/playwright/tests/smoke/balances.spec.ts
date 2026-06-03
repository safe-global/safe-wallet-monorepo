/**
 * Balances hybrid test — API setup + UI verification.
 *
 * Pattern: fetch expected data from CGW API, then verify the UI renders it.
 * This is the recommended approach for data-display pages.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { staticSafes, parseSafeAddress } from '../../src/data/safes'
import { ROUTES } from '../../src/data/constants'
import { safeGoto } from '../../src/utils/navigation'

const safeAddress = parseSafeAddress(staticSafes.SEP_STATIC_SAFE_2)

test.describe('Balances page', { tag: '@smoke' }, () => {
  test('should display token balances matching API data', async ({ safePage, safeApiClient }) => {
    // 1. API: get expected balances
    const balances = await safeApiClient.getBalances(safeAddress)

    // Precondition: test Safe must have tokens — fail fast if test data is broken
    expect(balances.items.length).toBeGreaterThan(0)

    // 2. UI: navigate to balances page (retries on 429)
    await safeGoto(safePage, `${ROUTES.balances}?safe=${staticSafes.SEP_STATIC_SAFE_2}`)

    // 3. Verify: UI shows the first token symbol from API
    const firstToken = balances.items[0]
    await expect(safePage.getByText(firstToken.tokenInfo.symbol)).toBeVisible()
  })
})
