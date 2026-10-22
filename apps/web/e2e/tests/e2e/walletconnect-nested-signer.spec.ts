/**
 * A Safe signs for its child Safe over WalletConnect: Safe{Wallet} on the child (wallet A) connects its signer to
 * Safe{Wallet} on the parent (wallet B) through the hosted relay.
 *
 * Wallet B is `safePage`, connected as OWNER_4, the parent's owner. Wallet A is a second browser context that
 * connects no private key: it pairs through the onboard WalletConnect module.
 */
import type { Page } from '@playwright/test'
import { Interface, Wallet, parseEther } from 'ethers'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { test as base, expect } from '../../src/fixtures/journey.fixture'
import { seedLocalStorage } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { seedNestedSafe, seedQueuedTransfer, type SeededSafe } from '../../src/seed/safe'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { isApprovedHash } from '../../src/chain/signatures'
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
// Once the parent executes approveHash, the Transaction Service indexes the event before CGW counts it
const ON_CHAIN_CONFIRMATION_TIMEOUT_MS = 60_000

const safeInterface = new Interface(['function approveHash(bytes32 hashToApprove)'])

const confirmationsOf = (transaction: Transaction): number | undefined =>
  transaction.executionInfo?.type === 'MULTISIG' ? transaction.executionInfo.confirmationsSubmitted : undefined

async function queuedIn(safeApiClient: SafeApiClient, safe: SeededSafe): Promise<Transaction[]> {
  return transactionsIn(await safeApiClient.getQueuedTransactions(safe.address))
}

type NestedSignerFixtures = {
  /** The owners and thresholds of the seeded Safes; 1/1 over 1/1 by default */
  nestedSafes: Parameters<typeof seedNestedSafe>[1]
  /** Wallet A: Safe{Wallet} in its own browser context, without a connected wallet */
  childPage: Page
  /** The Safes, with wallet A's signer connected to the parent in wallet B */
  pairing: { parent: SeededSafe; child: SeededSafe }
}

const test = base.extend<NestedSignerFixtures>({
  nestedSafes: [{}, { option: true }],

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

  pairing: async ({ safePage, childPage, journey, nestedSafes }, provide) => {
    const { parent, child } = await seedNestedSafe(journey, nestedSafes)
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

  test.describe('with a 2/2 child Safe that OWNER_4 and the parent own', () => {
    test.use({ nestedSafes: { child: { withOwner4: true, threshold: 2 } } })

    test('should add the on-chain confirmation of the parent to a queued transfer of the child Safe', async ({
      safePage,
      childPage,
      safeApiClient,
      journey,
      pairing,
    }) => {
      const queued = await seedQueuedTransfer(pairing.child, {
        nonce: 0,
        recipient: Wallet.createRandom().address,
        amount: AMOUNT,
      })
      const parentReview = new TxReviewPage(safePage)
      const queue = new TxQueuePage(childPage)

      await queue.goto(pairing.child.prefixedAddress)
      await expect(queue.transactionWithNonce(0)).toContainText('1/2')
      await queue.confirm(0)
      await new TxReviewPage(childPage).sign()
      await parentReview.sign()
      await parentReview.execute()
      await parentReview.waitForExecution()

      const approval = { safeAddress: pairing.child.address, owner: pairing.parent.address, hash: queued.safeTxHash }
      expect(await isApprovedHash(journey.env, approval)).toBe(true)
      await expect
        .poll(async () => (await queuedIn(safeApiClient, pairing.child)).map(confirmationsOf), {
          timeout: ON_CHAIN_CONFIRMATION_TIMEOUT_MS,
        })
        .toEqual([2])
    })
  })

  test.describe('with a 2/2 parent Safe', () => {
    test.use({ nestedSafes: { parent: { ownerCount: 2, threshold: 2 } } })

    test('should queue the approval in the parent Safe with the child transaction next to it', async ({
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
      await new TxReviewPage(safePage).sign()

      await expect.poll(async () => (await queuedIn(safeApiClient, pairing.parent)).map(confirmationsOf)).toEqual([1])
      const [childTransaction] = await queuedIn(safeApiClient, pairing.child)
      expect(confirmationsOf(childTransaction)).toBe(0)

      const [parentTransaction] = await queuedIn(safeApiClient, pairing.parent)
      const details = await safeApiClient.findTransaction(parentTransaction.id)
      const childSafeTxHash = childTransaction.id.split('_')[2]
      // Exactly approveHash: the envelope with the child transaction never reaches the parent
      expect(details?.txData?.hexData).toBe(safeInterface.encodeFunctionData('approveHash', [childSafeTxHash]))
    })
  })
})
