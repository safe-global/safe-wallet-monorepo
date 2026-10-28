/**
 * Assets › Positions shows the DeFi positions that Zerion reports for a Safe, through the gateway's portfolio.
 *
 * Runs only on the isolated stack, where the gateway calls a local Zerion (infra/mocks/zerion-api.ts). This checks
 * that the pieces work together; the page's rendering (groups, rows, position types, loans) has its Jest tests in
 * src/features/positions.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SafeApiClient } from '../../src/api/safe-api-client'
import { AssetsPage } from '../../src/pages/assets.page'
import { PositionsPage } from '../../src/pages/positions.page'
import { CHAIN_IDS, safeAddress } from '../../src/data/constants'

test.describe('DeFi positions', { tag: '@e2e' }, () => {
  test('should show a section for each app that Zerion reports, from the Positions tab of the assets', async ({
    safePage,
    safes,
  }) => {
    const portfolio = await new SafeApiClient(CHAIN_IDS.ethereum).getPortfolio(
      safeAddress(safes.ETH_ZERION_POSITIONS_SAFE),
    )
    const apps = portfolio.positionBalances.map(({ appInfo }) => appInfo.name)
    // Precondition: the scenario's positions reached the gateway.
    expect(apps.length, `Zerion lists no position for ${safes.ETH_ZERION_POSITIONS_SAFE}`).toBeGreaterThan(0)

    await new AssetsPage(safePage).goto(safes.ETH_ZERION_POSITIONS_SAFE)
    const positions = new PositionsPage(safePage)
    await positions.positionsTab.click()

    await expect(safePage).toHaveURL(/\/balances\/positions\?/)
    await expect(positions.totalValue).toBeVisible()
    await expect(positions.appSections).toHaveCount(apps.length)
    for (const app of apps) await expect(positions.appSection(app)).toBeVisible()
  })
})
