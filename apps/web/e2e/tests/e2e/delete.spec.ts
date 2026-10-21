import { Wallet } from 'ethers'
import { nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { TxQueuePage } from '../../src/pages/tx-queue.page'

test.describe('Delete a queued transaction', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should remove the last queued transaction when its proposer deletes it', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { threshold: 2 })
    await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: '0.001' })
    const last = await seedQueuedTransfer(safe, { nonce: 1, recipient, amount: '0.001' })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const queue = new TxQueuePage(safePage)
    await queue.openTransaction(safe.prefixedAddress, last.txId)
    await queue.deleteFromQueue()

    await expect.poll(() => safeApiClient.findTransaction(last.txId)).toBeNull()
    await expect
      .poll(async () => transactionsIn(await safeApiClient.getQueuedTransactions(safe.address)).map(nonceOf))
      .toEqual([0])

    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toBeVisible()
    await expect(queue.transactions).toHaveCount(1)
  })
})
