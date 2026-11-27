/**
 * The default token list and the positions of a mainnet Safe come from Zerion, through the gateway's portfolio.
 *
 * Runs only on the isolated stack, where the gateway calls a local Zerion (infra/mocks/zerion-api.ts). The scenario
 * makes Zerion list tokens and a position that the chain does not hold, so only the portfolio can show them.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SafeApiClient } from '../../src/api/safe-api-client'
import { AssetsPage } from '../../src/pages/assets.page'
import { HomePage } from '../../src/pages/home.page'
import { CHAIN_IDS, safeAddress } from '../../src/data/constants'

test.describe('Zerion portfolio', { tag: '@e2e' }, () => {
  test('should list the tokens that Zerion reports as default tokens and the Transaction Service tokens as all tokens', async ({
    safePage,
    safes,
  }) => {
    const mainnetApi = new SafeApiClient(CHAIN_IDS.ethereum)
    const address = safeAddress(safes.ETH_ZERION_SAFE)
    const portfolio = (await mainnetApi.getPortfolio(address)).tokenBalances.map(({ tokenInfo }) => tokenInfo.symbol)
    const onChain = (await mainnetApi.getBalances(address, 'usd', { trusted: false })).items.map(
      ({ tokenInfo }) => tokenInfo.symbol,
    )
    const zerionOnly = portfolio.filter((symbol) => !onChain.includes(symbol))
    // Precondition: Zerion lists a token that the chain does not hold, so the two lists can be told apart.
    expect(zerionOnly.length, `Zerion lists no token beyond the chain for ${safes.ETH_ZERION_SAFE}`).toBeGreaterThan(0)

    const assets = new AssetsPage(safePage)
    await assets.goto(safes.ETH_ZERION_SAFE)
    await assets.setHideSmallBalances(false)

    await assets.setShowAllTokens(false)
    await expect(assets.tokenRows).toHaveCount(portfolio.length)
    for (const symbol of portfolio) await expect(assets.rowForSymbol(symbol)).toBeVisible()

    await assets.setShowAllTokens(true)
    await expect(assets.tokenRows).toHaveCount(onChain.length)
    for (const symbol of zerionOnly) await expect(assets.rowForSymbol(symbol)).toHaveCount(0)
  })

  test('should show the positions that Zerion reports on the dashboard', async ({ safePage, safes }) => {
    const mainnetApi = new SafeApiClient(CHAIN_IDS.ethereum)
    const apps = (await mainnetApi.getPortfolio(safeAddress(safes.ETH_ZERION_SAFE))).positionBalances.map(
      ({ appInfo }) => appInfo.name,
    )
    // Precondition: the widget stays hidden without positions.
    expect(apps.length, `Zerion lists no position for ${safes.ETH_ZERION_SAFE}`).toBeGreaterThan(0)

    const home = new HomePage(safePage)
    await home.goto(safes.ETH_ZERION_SAFE)

    for (const app of apps) await expect(home.positionsWidget).toContainText(app)
  })
})
