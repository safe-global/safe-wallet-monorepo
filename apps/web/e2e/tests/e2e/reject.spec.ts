import { Wallet } from 'ethers'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

function rejectionNonces(history: TransactionItemPage): Array<number | undefined> {
  return transactionsIn(history)
    .filter((tx) => tx.txInfo.type === 'Custom' && tx.txInfo.isCancellation)
    .map(nonceOf)
}

test.describe('Reject a queued transaction', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should execute an on-chain rejection at the nonce of the transfer when an owner rejects it', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { threshold: 1 })
    const transfer = await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: '0.001' })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.openTransaction(safe.prefixedAddress, transfer.txId)
    await queue.reject()
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect.poll(async () => (await safeApiClient.getSafeInfo(safe.address)).nonce).toBe(1)
    await expect.poll(async () => transactionsIn(await safeApiClient.getQueuedTransactions(safe.address))).toEqual([])
    await expect.poll(async () => rejectionNonces(await safeApiClient.getTransactionHistory(safe.address))).toEqual([0])
    expect(await balanceOf(journey.env, recipient)).toBe(0n)

    await safePage.goto(`${ROUTES.transactionsHistory}?safe=${safe.prefixedAddress}`)
    await expect(safePage.getByText('On-chain rejection')).toBeVisible()
  })
})
