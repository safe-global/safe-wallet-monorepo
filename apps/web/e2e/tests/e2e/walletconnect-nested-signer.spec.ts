/**
 * A Safe signs for its child Safe over WalletConnect: Safe{Wallet} on the child (wallet A) connects its signer to
 * Safe{Wallet} on the parent (wallet B) through the hosted relay.
 *
 * Wallet B is `safePage`, connected as OWNER_4, the parent's owner. Wallet A is a second browser context that
 * connects no private key: it pairs through the onboard WalletConnect module.
 */
import type { Page } from '@playwright/test'
import { Wallet, parseEther } from 'ethers'
import { test as base, expect } from '../../src/fixtures/journey.fixture'
import { seedLocalStorage } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { seedNestedSafe, type SafeAddress, type SeededSafe } from '../../src/seed/safe'
import { short } from '../../environment/scenarios/chain.mjs'
import { ROUTES } from '../../src/data/constants'
import { WalletConnectPage } from '../../src/pages/walletconnect.page'
import { WalletPage } from '../../src/pages/wallet.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { balanceOf } from '../../src/chain/balances'
import { transactionsIn } from '../../src/api/transaction-items'

const AMOUNT = '0.01'

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

  test('should execute a transfer of the child Safe when the parent approves and executes it in its own wallet', async ({
    safePage,
    childPage,
    safeApiClient,
    journey,
    pairing,
  }) => {
    const recipient = Wallet.createRandom().address
    const parentReview = new TxReviewPage(safePage)
    const childReview = new TxReviewPage(childPage)

    const send = new SendTokensPage(childPage)
    await send.open()
    await send.fillTransfer({ recipient, amount: AMOUNT })
    await send.nextButton.click()
    // A Safe signs on chain: the child's signature asks the parent for an approveHash transaction.
    await childReview.sign()
    await parentReview.sign()
    await parentReview.execute()
    // The parent can execute the next request only once it has reloaded its nonce
    await parentReview.waitForIndexing()

    const queue = new TxQueuePage(childPage)
    await queue.goto(pairing.child.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/1')
    await queue.execute(0)
    await childReview.continueAndExecute()
    await parentReview.sign()
    await parentReview.execute()
    await parentReview.waitForExecution()

    await expect.poll(async () => (await safeApiClient.getSafeInfo(pairing.child.address)).nonce).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })

  test('should show a user rejection in the child Safe when the parent discards the request', async ({
    safePage,
    childPage,
    safeApiClient,
    pairing,
  }) => {
    const send = new SendTokensPage(childPage)
    await send.open()
    await send.fillTransfer({ recipient: Wallet.createRandom().address, amount: AMOUNT })
    await send.nextButton.click()
    await new TxReviewPage(childPage).sign()
    await new TxReviewPage(safePage).discard()

    await expect(childPage.getByText('User rejected signing.')).toBeVisible()
    expect(transactionsIn(await safeApiClient.getQueuedTransactions(pairing.child.address))).toEqual([])
  })
})
