/**
 * A Safe signs for its child Safe over WalletConnect: Safe{Wallet} on the child (wallet A) connects its signer to
 * Safe{Wallet} on the parent (wallet B) through the hosted relay.
 *
 * Wallet B is `safePage`, connected as OWNER_4, the parent's owner. Wallet A is a second browser context that
 * connects no private key: it pairs through the onboard WalletConnect module.
 */
import type { Page } from '@playwright/test'
import { Wallet, hashMessage, parseEther } from 'ethers'
import { HomePage } from '../../src/pages/home.page'
import { test as base, expect } from '../../src/fixtures/journey.fixture'
import { seedLocalStorage } from '../../src/fixtures/test.fixture'
import { addSafeToAccounts } from '../../src/fixtures/seed-added-safes'
import { seedNestedSafe, seedQueuedTransfer, type SeededSafe } from '../../src/seed/safe'
import { short } from '../../environment/scenarios/chain.mjs'
import { CHAIN_IDS } from '../../src/data/constants'
import { DAPP_NAME, WalletConnectDapp } from '../../src/api/walletconnect-dapp'
import { isApprovedHash, isValidSafeSignature } from '../../src/chain/signatures'
import { confirmPendingMessage } from '../../src/seed/messages'
import { WalletConnectPage } from '../../src/pages/walletconnect.page'
import { WalletPage } from '../../src/pages/wallet.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { balanceOf } from '../../src/chain/balances'
import { approveHashData, confirmationsOf, safeTxHashOf } from '../../src/api/transaction-items'

const AMOUNT = '0.01'

type NestedSignerFixtures = {
  /** The owners and thresholds of the seeded Safes; 1/1 over 1/1 by default */
  nestedSafes: Parameters<typeof seedNestedSafe>[1]
  /** Wallet A: Safe{Wallet} in its own browser context, without a connected wallet */
  childPage: Page
  /** The Safes, with wallet A's signer connected to the parent in wallet B */
  pairing: { parent: SeededSafe; child: SeededSafe }
  /** A dApp in a session with wallet A, the child Safe's wallet */
  childDapp: WalletConnectDapp
}

const test = base.extend<NestedSignerFixtures>({
  nestedSafes: [
    { parent: { owners: ['owner4'], threshold: 1 }, child: { owners: ['parent'], threshold: 1 } },
    { option: true },
  ],
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
    await new HomePage(safePage).goto(parent.prefixedAddress)
    await new WalletPage(safePage).accountCenter.waitFor({ state: 'visible' })
    await addSafeToAccounts(childPage, child.prefixedAddress)
    await new HomePage(childPage).goto(child.prefixedAddress)

    const uri = await new WalletPage(childPage).startWalletConnectPairing()
    const parentWalletConnect = new WalletConnectPage(safePage)
    await parentWalletConnect.pair(uri)
    await parentWalletConnect.approveButton.click()
    // A reload before the child has the session leaves it without a wallet: the app reconnects only a saved one
    await expect(new WalletPage(childPage).accountCenter).toContainText(short(parent.address))

    await provide({ parent, child })
  },

  childDapp: async ({ childPage, pairing }, provide, testInfo) => {
    await expect(new WalletPage(childPage).accountCenter).toContainText(short(pairing.parent.address))
    const dapp = await WalletConnectDapp.start(CHAIN_IDS.sepolia)
    try {
      const childWalletConnect = new WalletConnectPage(childPage)
      await childWalletConnect.pair(await dapp.connect())
      await childWalletConnect.proposal(DAPP_NAME).waitFor({ state: 'visible' })
      await childWalletConnect.approveButton.click()
      await dapp.waitForSession()
      await provide(dapp)
    } finally {
      // The test's final status is known only here, after it ran
      if (testInfo.status !== testInfo.expectedStatus) {
        await testInfo.attach('walletconnect-dapp-log', { body: dapp.log.join('\n'), contentType: 'text/plain' })
      }
      await dapp.close()
    }
  },
})

test.describe('WalletConnect nested signer', { tag: ['@e2e', '@walletconnect'] }, () => {
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
    await parentReview.signAndExecute()

    await expect.poll(() => safeApiClient.getNonce(pairing.child.address)).toBe(1)
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
    expect(await safeApiClient.getQueued(pairing.child.address)).toEqual([])
  })

  test.describe('with a 2/2 child Safe that OWNER_4 and the parent own', () => {
    test.use({
      nestedSafes: {
        parent: { owners: ['owner4'], threshold: 1 },
        child: { owners: ['owner4', 'parent'], threshold: 2 },
      },
    })

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
      await parentReview.signAndExecute()

      const approval = { safeAddress: pairing.child.address, owner: pairing.parent.address, hash: queued.safeTxHash }
      expect(await isApprovedHash(journey.env, approval)).toBe(true)
      await expect
        .poll(async () => (await safeApiClient.getQueued(pairing.child.address)).map(confirmationsOf))
        .toEqual([2])
    })
  })

  test.describe('with a 2/2 parent Safe', () => {
    test.use({
      nestedSafes: {
        parent: { owners: ['owner4', 'owner1'], threshold: 2 },
        child: { owners: ['parent'], threshold: 1 },
      },
    })

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

      await expect
        .poll(async () => (await safeApiClient.getQueued(pairing.parent.address)).map(confirmationsOf))
        .toEqual([1])
      const [childTransaction] = await safeApiClient.getQueued(pairing.child.address)
      expect(confirmationsOf(childTransaction)).toBe(0)

      const [parentTransaction] = await safeApiClient.getQueued(pairing.parent.address)
      const details = await safeApiClient.findTransaction(parentTransaction.id)
      const childSafeTxHash = safeTxHashOf(childTransaction)
      // Exactly approveHash: the envelope with the child transaction never reaches the parent
      expect(details?.txData?.hexData).toBe(approveHashData(childSafeTxHash))
    })
  })

  test.describe('with a child Safe 1.5.0', () => {
    // Below 1.5.0 a Safe asks a contract owner about the message preimage, so only 1.5.0 children can work
    test.use({
      nestedSafes: {
        parent: { owners: ['owner4'], threshold: 1 },
        child: { owners: ['parent'], threshold: 1, safeVersion: '1.5.0' },
      },
    })

    test('should give a dApp of the child Safe a signature that the child accepts when the parent signs the message', async ({
      safePage,
      childPage,
      journey,
      pairing,
      childDapp,
    }) => {
      const message = `Safe E2E nested message ${Date.now()}`
      const response = childDapp.request('personal_sign', [message, pairing.child.address])
      const childReview = new TxReviewPage(childPage)
      await childReview.signMessageButton.click()
      await new TxReviewPage(safePage).signMessage()
      await childReview.signedMessageContinueButton.click()

      const answer = await response
      expect(answer).toEqual({ result: expect.stringMatching(/^0x[0-9a-f]+$/) })
      const { result: signature } = answer as { result: string }
      const safeAddress = pairing.child.address
      expect(await isValidSafeSignature(journey.env, { safeAddress, hash: hashMessage(message), signature })).toBe(true)
    })

    test.describe('and a 2/2 child of OWNER_4 and the parent', () => {
      test.use({
        nestedSafes: {
          parent: { owners: ['owner4'], threshold: 1 },
          child: { owners: ['owner4', 'parent'], threshold: 2, safeVersion: '1.5.0' },
        },
      })

      test('should combine the contract signature of the parent with the signature of OWNER_4', async ({
        safePage,
        childPage,
        journey,
        pairing,
        childDapp,
      }) => {
        const message = `Safe E2E nested message ${Date.now()}`
        const response = childDapp.request('personal_sign', [message, pairing.child.address])
        const childReview = new TxReviewPage(childPage)
        await childReview.signMessageButton.click()
        await new TxReviewPage(safePage).signMessage()
        // The parent's signature proposes the message at 1/2; OWNER_4 adds the second one
        await confirmPendingMessage(journey.env, pairing.child.address, journey.owners.owner4)
        await childReview.signedMessageContinueButton.click()

        const { result: signature } = (await response) as { result: string }
        const safeAddress = pairing.child.address
        expect(await isValidSafeSignature(journey.env, { safeAddress, hash: hashMessage(message), signature })).toBe(
          true,
        )
      })
    })

    test.describe('and a 2/2 parent of OWNER_4 and OWNER_1', () => {
      test.use({
        nestedSafes: {
          parent: { owners: ['owner4', 'owner1'], threshold: 2 },
          child: { owners: ['parent'], threshold: 1, safeVersion: '1.5.0' },
        },
      })

      test('should sign for the child once both owners of the parent signed the parent message', async ({
        safePage,
        childPage,
        journey,
        pairing,
        childDapp,
      }) => {
        const message = `Safe E2E nested message ${Date.now()}`
        const response = childDapp.request('personal_sign', [message, pairing.child.address])
        const childReview = new TxReviewPage(childPage)
        const parentReview = new TxReviewPage(safePage)
        await childReview.signMessageButton.click()
        await parentReview.signMessageButton.click()
        // OWNER_4 signed the parent's message at 1/2; OWNER_1 adds the second one, then wallet B answers wallet A
        await confirmPendingMessage(journey.env, pairing.parent.address, journey.owners.owner1)
        await parentReview.signedMessageContinueButton.click()
        await childReview.signedMessageContinueButton.click()

        const { result: signature } = (await response) as { result: string }
        const safeAddress = pairing.child.address
        expect(await isValidSafeSignature(journey.env, { safeAddress, hash: hashMessage(message), signature })).toBe(
          true,
        )
      })
    })
  })
})
