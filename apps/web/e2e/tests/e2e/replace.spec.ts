import { Wallet, parseEther } from 'ethers'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const AMOUNT = '0.001'
const REPLACEMENT_AMOUNT = '0.002'

function recipientsAtNonce(history: TransactionItemPage, nonce: number): string[] {
  return transactionsIn(history)
    .filter((tx) => nonceOf(tx) === nonce)
    .map((tx) => (tx.txInfo.type === 'Transfer' ? tx.txInfo.recipient.value : tx.txInfo.type))
}

test.describe('Replace a queued transaction', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should execute the replacement at the nonce of the original when an owner replaces it', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const [recipient, newRecipient] = [Wallet.createRandom().address, Wallet.createRandom().address]
    const safe = await seedSafe(journey, { threshold: 1 })
    const original = await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: AMOUNT })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const queue = new TxQueuePage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.openTransaction(safe.prefixedAddress, original.txId)
    await queue.replace()
    await sendTokens.fillTransfer({ recipient: newRecipient, amount: REPLACEMENT_AMOUNT })
    await sendTokens.nextButton.click()
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect
      .poll(async () => recipientsAtNonce(await safeApiClient.getTransactionHistory(safe.address), 0))
      .toEqual([newRecipient])
    await expect.poll(async () => transactionsIn(await safeApiClient.getQueuedTransactions(safe.address))).toEqual([])
    expect(await balanceOf(journey.env, newRecipient)).toBe(parseEther(REPLACEMENT_AMOUNT))
    expect(await balanceOf(journey.env, recipient)).toBe(0n)

    await queue.goto(safe.prefixedAddress)
    await expect(queue.emptyQueue).toBeVisible()
  })
})
