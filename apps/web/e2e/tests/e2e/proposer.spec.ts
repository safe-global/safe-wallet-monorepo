import type { Page } from '@playwright/test'
import { Wallet, parseEther } from 'ethers'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { test, expect, type Journey } from '../../src/fixtures/journey.fixture'
import { seedProposer } from '../../src/seed/proposers'
import { seedSafe, type SeededSafe } from '../../src/seed/safe'
import { waitForNativeBalance } from '../../src/seed/tokens'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

const AMOUNT = '0.001'

function queuedIds(queue: QueuedItemPage): string[] {
  return transactionsIn(queue).map((tx) => tx.id)
}

/** A 1/1 Safe of OWNER_4 and OWNER_1 with OWNER_3 as its proposer, opened by OWNER_3 */
async function seedProposerSafe(journey: Journey, safePage: Page): Promise<SeededSafe> {
  const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })
  await seedProposer(safe, { delegate: journey.owners.owner3, delegator: journey.owners.owner4 })
  await waitForNativeBalance(safe)

  await journey.connectAs('owner3')
  await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
  return safe
}

test.describe('Proposer', { tag: '@e2e' }, () => {
  test('should execute a transfer that a proposer proposed once an owner signs it', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedProposerSafe(journey, safePage)

    const sendTokens = new SendTokensPage(safePage)
    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.propose()

    await expect.poll(async () => queuedIds(await safeApiClient.getQueuedTransactions(safe.address))).toHaveLength(1)
    const [txId] = queuedIds(await safeApiClient.getQueuedTransactions(safe.address))
    const details = await safeApiClient.findTransaction(txId)
    const execution = details?.detailedExecutionInfo
    expect(execution?.type === 'MULTISIG' && execution.proposedByDelegate?.value).toBe(journey.owners.owner3.address)
    expect(execution?.type === 'MULTISIG' && execution.confirmations).toEqual([])

    await journey.connectAs('owner4')
    await queue.goto(safe.prefixedAddress)
    await queue.confirm(0)
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect.poll(async () => (await safeApiClient.getSafeInfo(safe.address)).nonce).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })

  test('should remove a queued transaction when the proposer that proposed it deletes it', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedProposerSafe(journey, safePage)

    const sendTokens = new SendTokensPage(safePage)
    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient: Wallet.createRandom().address, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.propose()

    await expect.poll(async () => queuedIds(await safeApiClient.getQueuedTransactions(safe.address))).toHaveLength(1)
    const [txId] = queuedIds(await safeApiClient.getQueuedTransactions(safe.address))
    await queue.openTransaction(safe.prefixedAddress, txId)
    await queue.deleteFromQueue()

    await expect.poll(() => safeApiClient.findTransaction(txId)).toBeNull()
    await expect.poll(async () => queuedIds(await safeApiClient.getQueuedTransactions(safe.address))).toEqual([])
  })
})
