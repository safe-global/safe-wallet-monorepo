/**
 * A parent Safe signs for its child Safe inside Safe{Wallet}, without WalletConnect. The connected wallet is
 * OWNER_4, an owner of the parent only. On the child's review it picks the parent as the signer: the app then
 * proposes an `approveHash` transaction in the parent, which carries the child transaction to the Queue Service.
 */
import { Wallet, parseEther } from 'ethers'
import type { Page } from '@playwright/test'
import { HomePage } from '../../src/pages/home.page'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedNestedSafe, seedQueuedTransfer, type SeededSafe } from '../../src/seed/safe'
import { approveHashData, confirmationsOf, safeTxHashOf } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { isApprovedHash } from '../../src/chain/signatures'
import { NestedTxSuccessPage } from '../../src/pages/nested-tx-success.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const AMOUNT = '0.01'
// The Queue Service adds the parent's on-chain approval when the Transaction Service has indexed it
const ON_CHAIN_CONFIRMATION_TIMEOUT_MS = 60_000

/** Open the child Safe and fill a transfer up to its review */
async function reviewTransfer(page: Page, child: SeededSafe, recipient: string): Promise<void> {
  await new HomePage(page).goto(child.prefixedAddress)
  const sendTokens = new SendTokensPage(page)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
}

test.describe('In-app nested signer', { tag: '@e2e' }, () => {
  test('should execute a transfer of the child Safe once the parent Safe executes its approval', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const { parent, child } = await seedNestedSafe(journey, {
      parent: { owners: ['owner4'], threshold: 1 },
      child: { owners: ['parent'], threshold: 1 },
    })
    const review = new TxReviewPage(safePage)
    const success = new NestedTxSuccessPage(safePage)
    const queue = new TxQueuePage(safePage)

    await reviewTransfer(safePage, child, recipient)
    await review.waitForSigner(parent.address)
    await review.sign()

    await expect(success.status).toHaveText('One more step in the parent Safe')
    await expect(safePage.getByText('approveHash', { exact: true })).toBeVisible()
    await expect.poll(async () => (await safeApiClient.getQueued(child.address)).map(confirmationsOf)).toEqual([0])
    const [childTransaction] = await safeApiClient.getQueued(child.address)
    const [parentTransaction] = await safeApiClient.getQueued(parent.address)
    const parentDetails = await safeApiClient.findTransaction(parentTransaction.id)
    expect(parentDetails?.txData?.hexData).toBe(approveHashData(safeTxHashOf(childTransaction)))
    expect(await safeApiClient.getNonce(parent.address)).toBe(0)

    await success.openParentTransaction()
    await expect(safePage.getByText('Nested transaction')).toBeVisible()
    await queue.goto(parent.prefixedAddress)
    await queue.execute(0)
    await review.continueAndExecute()
    await review.waitForExecution()

    expect(
      await isApprovedHash(journey.env, {
        safeAddress: child.address,
        owner: parent.address,
        hash: safeTxHashOf(childTransaction),
      }),
    ).toBe(true)
    await expect
      .poll(async () => (await safeApiClient.getQueued(child.address)).map(confirmationsOf), {
        timeout: ON_CHAIN_CONFIRMATION_TIMEOUT_MS,
      })
      .toEqual([1])
    await queue.goto(child.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/1')
    await queue.execute(0)
    await review.continueAndExecute()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(child.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })

  test('should propose nothing in either Safe when the transfer is discarded on the review', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { parent, child } = await seedNestedSafe(journey, {
      parent: { owners: ['owner4'], threshold: 1 },
      child: { owners: ['parent'], threshold: 1 },
    })
    const review = new TxReviewPage(safePage)

    await reviewTransfer(safePage, child, Wallet.createRandom().address)
    await review.waitForSigner(parent.address)
    await review.discard()

    await expect(review.signerSelect).toBeHidden()
    expect(await safeApiClient.getQueued(child.address)).toEqual([])
    expect(await safeApiClient.getQueued(parent.address)).toEqual([])
    expect(await safeApiClient.getNonce(parent.address)).toBe(0)
  })

  test('should add the parent Safe as the second confirmation of a transfer that the owner already signed', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const { owner4 } = journey.owners
    const { parent, child } = await seedNestedSafe(journey, {
      parent: { owners: ['owner4'], threshold: 1 },
      child: { owners: ['owner4', 'parent'], threshold: 2 },
    })
    const seeded = await seedQueuedTransfer(child, { nonce: 0, recipient, amount: AMOUNT })
    const review = new TxReviewPage(safePage)
    const queue = new TxQueuePage(safePage)

    await queue.goto(child.prefixedAddress)
    await queue.confirm(0)
    await review.waitForSigner(parent.address)
    await review.signerSelect.click()
    await expect(review.signerOption(owner4.address)).toContainText('Already signed')
    await safePage.keyboard.press('Escape')
    await review.sign()

    await expect(new NestedTxSuccessPage(safePage).status).toHaveText('One more step in the parent Safe')
    await expect.poll(async () => (await safeApiClient.getQueued(parent.address)).length).toBe(1)
    const [parentTransaction] = await safeApiClient.getQueued(parent.address)
    const parentDetails = await safeApiClient.findTransaction(parentTransaction.id)
    expect(parentDetails?.txData?.hexData).toBe(approveHashData(seeded.safeTxHash))
    expect((await safeApiClient.getQueued(child.address)).map(safeTxHashOf)).toEqual([seeded.safeTxHash])

    await queue.goto(parent.prefixedAddress)
    await queue.execute(0)
    await review.continueAndExecute()
    await review.waitForExecution()

    await expect
      .poll(async () => (await safeApiClient.getQueued(child.address)).map(confirmationsOf), {
        timeout: ON_CHAIN_CONFIRMATION_TIMEOUT_MS,
      })
      .toEqual([2])
    await queue.goto(child.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('2/2')
    await queue.execute(0)
    await review.continueAndExecute()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(child.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })

  test('should sign through the parent Safe when the owner picks it instead of signing directly', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { parent, child } = await seedNestedSafe(journey, {
      parent: { owners: ['owner4'], threshold: 1 },
      child: { owners: ['owner4', 'parent'], threshold: 2 },
    })
    const review = new TxReviewPage(safePage)

    await reviewTransfer(safePage, child, Wallet.createRandom().address)
    await review.waitForSigner(journey.owners.owner4.address)
    await review.chooseSigner(parent.address)
    await review.waitForSigner(parent.address)
    await review.sign()

    await expect(new NestedTxSuccessPage(safePage).status).toHaveText('One more step in the parent Safe')
    await expect(safePage.getByText('approveHash', { exact: true })).toBeVisible()
    await expect.poll(async () => (await safeApiClient.getQueued(parent.address)).length).toBe(1)
    expect((await safeApiClient.getQueued(child.address)).map(confirmationsOf)).toEqual([0])
  })
})
