/**
 * Regression — a wallet can be disconnected from the account center and connected again.
 *
 * The journeys seed the wallet into storage, so this is the one spec that drives the web3-onboard
 * modal and the account center's Disconnect button end to end. Both live in a shadow DOM and a
 * popover that only a real browser renders, hence Playwright.
 *
 * Data: the `basic` Safe (read-only) and Alice's key — parallel-safe, no cleanup.
 *
 * Run: SAFE_E2E_SPECS=wallet-reconnect yarn workspace @safe-global/web e2e:env playwright
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { HomePage } from '../../src/pages/home.page'
import { short } from '../../environment/scenarios/chain.mjs'

test.describe('Wallet connection', { tag: '@regression' }, () => {
  test('should connect the same wallet again when it is disconnected from the account center', async ({
    safePage,
    walletPage,
    owners,
    safes,
  }) => {
    const ownerAddress = short(owners.alice.address)

    await new HomePage(safePage).goto(safes.basic)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(owners.alice.privateKey)
    await expect(walletPage.accountCenter).toContainText(ownerAddress)

    await walletPage.disconnect()
    await expect(walletPage.accountCenter).toBeHidden()

    await walletPage.connectWallet(owners.alice.privateKey)
    await expect(walletPage.accountCenter).toContainText(ownerAddress)
  })
})
