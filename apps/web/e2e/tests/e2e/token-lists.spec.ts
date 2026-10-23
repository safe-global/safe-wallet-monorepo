/**
 * "Default tokens" lists only the tokens that the Transaction Service trusts; "All tokens" lists every token.
 *
 * Runs only on the isolated stack. There CGW runs without Zerion, so the portfolio request of "Default tokens" fails
 * and the wallet falls back to the tokens that the Transaction Service trusts; the scenario trusts a known set of the
 * Safe's tokens. On staging the default list comes from Zerion instead.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { SafeApiClient } from '../../src/api/safe-api-client'
import { AssetsPage } from '../../src/pages/assets.page'
import { CHAIN_IDS, safeAddress } from '../../src/data/constants'

test.describe('Token lists', { tag: '@e2e' }, () => {
  test('should hide the untrusted tokens in the default list and show them in the list of all tokens', async ({
    safePage,
    safes,
  }) => {
    const mainnetApi = new SafeApiClient(CHAIN_IDS.ethereum)
    const address = safeAddress(safes.ETH_TOKEN_LIST_SAFE)
    const symbolsOf = async (trusted: boolean) =>
      (await mainnetApi.getBalances(address, 'usd', { trusted })).items.map(({ tokenInfo }) => tokenInfo.symbol)
    const trusted = await symbolsOf(true)
    const all = await symbolsOf(false)
    const untrusted = all.filter((symbol) => !trusted.includes(symbol))
    // Precondition: the lists only differ when the Safe holds a token that the Transaction Service does not trust.
    expect(untrusted.length, `${safes.ETH_TOKEN_LIST_SAFE} holds no untrusted token`).toBeGreaterThan(0)

    const assets = new AssetsPage(safePage)
    await assets.goto(safes.ETH_TOKEN_LIST_SAFE)
    await assets.setHideSmallBalances(false)

    await assets.setShowAllTokens(false)
    await expect(assets.tokenRows).toHaveCount(trusted.length)
    for (const symbol of trusted) await expect(assets.rowForSymbol(symbol)).toBeVisible()

    await assets.setShowAllTokens(true)
    await expect(assets.tokenRows).toHaveCount(all.length)
    for (const symbol of untrusted) await expect(assets.rowForSymbol(symbol)).toBeVisible()

    await assets.setShowAllTokens(false)
    await expect(assets.tokenRows).toHaveCount(trusted.length)
    for (const symbol of untrusted) await expect(assets.rowForSymbol(symbol)).toHaveCount(0)
  })
})
