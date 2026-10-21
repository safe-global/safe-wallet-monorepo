import { Wallet } from 'ethers'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { seedSignedTransfer } from '../../src/seed/signatures'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

const AMOUNT = '0.001'

function executionSummary(history: TransactionItemPage): { executed: number; ethereumTransactions: number } {
  const txHashes = transactionsIn(history)
    .filter((tx) => nonceOf(tx) !== undefined)
    .map((tx) => tx.txHash)
  return { executed: txHashes.length, ethereumTransactions: new Set(txHashes).size }
}

test.describe('Bulk execute queued transactions', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should execute only the fully signed transactions before the first unsigned one when an owner bulk executes', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { threshold: 2, ownerCount: 3 })
    await seedSignedTransfer(journey, safe, { nonce: 0, recipient, amount: AMOUNT })
    await seedSignedTransfer(journey, safe, { nonce: 1, recipient, amount: AMOUNT })
    await seedQueuedTransfer(safe, { nonce: 2, recipient, amount: AMOUNT })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.bulkExecuteButton).toHaveText('Bulk execute 2 transactions')
    await queue.bulkExecuteButton.click()
    await review.executeBulk()

    await expect.poll(async () => (await safeApiClient.getSafeInfo(safe.address)).nonce).toBe(2)
    await expect
      .poll(async () => executionSummary(await safeApiClient.getTransactionHistory(safe.address)))
      .toEqual({ executed: 2, ethereumTransactions: 1 })
    await expect
      .poll(async () => transactionsIn(await safeApiClient.getQueuedTransactions(safe.address)).map(nonceOf))
      .toEqual([2])

    await safePage.goto(`${ROUTES.transactionsHistory}?safe=${safe.prefixedAddress}`)
    const bulkGroup = safePage.getByTestId('grouped-items').filter({ hasText: 'Bulk transactions' })
    await expect(bulkGroup.getByTestId('transaction-item')).toHaveCount(2)
  })
})
