/**
 * A Safe signs for its child Safe over WalletConnect: Safe{Wallet} on the child (wallet A) connects its signer to
 * Safe{Wallet} on the parent (wallet B) through the hosted relay.
 *
 * Wallet B is `safePage`, connected as OWNER_4, the parent's owner. Wallet A is a second browser context that
 * connects no private key: it pairs through the onboard WalletConnect module.
 */
import type { Page } from '@playwright/test'
import { test as base, expect } from '../../src/fixtures/journey.fixture'
import { seedLocalStorage } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { seedNestedSafe, type SafeAddress, type SeededSafe } from '../../src/seed/safe'
import { short } from '../../environment/scenarios/chain.mjs'
import { ROUTES } from '../../src/data/constants'
import { WalletConnectPage } from '../../src/pages/walletconnect.page'
import { WalletPage } from '../../src/pages/wallet.page'

type NestedSignerFixtures = {
  /** Wallet A: Safe{Wallet} in its own browser context, without a connected wallet */
  childPage: Page
  /** The Safes, with wallet A's signer connected to the parent in wallet B */
  pairing: { parent: SeededSafe; child: SafeAddress }
}

const test = base.extend<NestedSignerFixtures>({
  childPage: async ({ browser }, provide, testInfo) => {
    const context = await browser.newContext({
      baseURL: testInfo.project.use.baseURL,
      recordVideo: { dir: testInfo.outputPath('child-video') },
    })
    const page = await context.newPage()
    await seedLocalStorage(page)
    try {
      await provide(page)
    } finally {
      await context.close()
      const video = await page.video()?.path()
      if (video && testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('child-wallet-video', { path: video, contentType: 'video/webm' })
      }
    }
  },

  pairing: async ({ safePage, childPage, journey }, provide) => {
    const { parent, child } = await seedNestedSafe(journey)
    await safePage.goto(`${ROUTES.home}?safe=${parent.prefixedAddress}`)
    await new WalletPage(safePage).accountCenter.waitFor({ state: 'visible' })
    await childPage.goto(`${ROUTES.home}?safe=${child.prefixedAddress}`)

    const uri = await new WalletPage(childPage).startWalletConnectPairing()
    const parentWalletConnect = new WalletConnectPage(safePage)
    await parentWalletConnect.pair(uri)
    await parentWalletConnect.approveButton.click()

    await provide({ parent, child })
  },
})

test.describe('WalletConnect nested signer', { tag: ['@e2e', '@walletconnect'] }, () => {
  test.skip(!isIsolated, 'Seeds its own Safes on the isolated stack')
  // The hosted relay can drop a message; a second pairing tells that apart from a defect.
  test.describe.configure({ retries: 1 })

  test('should connect the parent Safe as the signer of the child Safe when the parent approves the session', async ({
    safePage,
    childPage,
    pairing,
  }) => {
    await expect(new WalletPage(childPage).accountCenter).toContainText(short(pairing.parent.address))

    const parentWalletConnect = new WalletConnectPage(safePage)
    await parentWalletConnect.open()
    await expect(parentWalletConnect.sessions).toHaveCount(1)
  })
})
