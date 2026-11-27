/**
 * Regression — a wallet can be disconnected from the account center and connected again.
 *
 * The journeys seed the wallet into storage, so this is the one spec that drives the web3-onboard
 * modal and the account center's Disconnect button end to end. Both live in a shadow DOM and a
 * popover that only a real browser renders, hence Playwright.
 *
 * Data: a static Safe (read-only) and the OWNER_4 key — parallel-safe, no cleanup.
 *
 * Run: yarn workspace @safe-global/web pw:test wallet-reconnect
 * Tag: @regression — runs under the chromium project, on demand.
 */
import { computeAddress } from 'ethers'
import { test, expect } from '../../src/fixtures/test.fixture'
import { HomePage } from '../../src/pages/home.page'
import { short } from '../../environment/scenarios/chain.mjs'

test.describe('Wallet connection', { tag: '@regression' }, () => {
  test('should connect the same wallet again when it is disconnected from the account center', async ({
    safePage,
    walletPage,
    credentials,
    safes,
  }) => {
    const ownerAddress = short(computeAddress(credentials.OWNER_4_PRIVATE_KEY))

    await new HomePage(safePage).goto(safes.SEP_STATIC_SAFE_2)
    await walletPage.acceptCookies()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toContainText(ownerAddress)

    await walletPage.disconnect()
    await expect(walletPage.accountCenter).toBeHidden()

    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await expect(walletPage.accountCenter).toContainText(ownerAddress)
  })
})
