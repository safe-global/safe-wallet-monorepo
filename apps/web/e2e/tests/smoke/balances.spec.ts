/**
 * Balances hybrid test — API setup + UI verification.
 *
 * Pattern: fetch expected data from CGW API, then verify the UI renders it.
 * This is the recommended approach for data-display pages.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SAFES, ROUTES } from '../../src/data/constants'

const safeAddress = SAFES.SEP_STATIC_SAFE_1.split(':')[1]

test.describe('Balances page', { tag: '@smoke' }, () => {
  test('should display token balances matching API data', async ({ safePage, safeApiClient }) => {
    // 1. API: get expected balances
    const balances = await safeApiClient.getBalances(safeAddress)

    // Precondition: test Safe must have tokens — fail fast if test data is broken
    expect(balances.items.length).toBeGreaterThan(0)

    // 2. UI: navigate to balances page
    await safePage.goto(`${ROUTES.balances}?safe=${SAFES.SEP_STATIC_SAFE_1}`)

    // 3. Verify: UI shows the first token symbol from API
    const firstToken = balances.items[0]
    await expect(safePage.getByText(firstToken.tokenInfo.symbol)).toBeVisible()
  })
})
