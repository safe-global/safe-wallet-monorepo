import { Wallet, parseEther } from 'ethers'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { HomePage } from '../../src/pages/home.page'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { BatchSidebarPage } from '../../src/pages/batch-sidebar.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const FIRST_AMOUNT = '0.001'
const SECOND_AMOUNT = '0.002'

function multiSendActionCounts(history: TransactionItemPage): number[] {
  return transactionsIn(history).flatMap(({ txInfo }) =>
    txInfo.type === 'Custom' && 'actionCount' in txInfo ? [txInfo.actionCount] : [],
  )
}

test.describe('Execute a batch', { tag: '@e2e' }, () => {
  test('should pay every batched recipient in one multisend when an owner executes the batch', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const [firstRecipient, secondRecipient] = [Wallet.createRandom().address, Wallet.createRandom().address]
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })

    const batch = new BatchSidebarPage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await batch.sendTokensFromEmptyBatch()
    await sendTokens.fillTransfer({ recipient: firstRecipient, amount: FIRST_AMOUNT })
    await sendTokens.nextButton.click()
    await review.addToBatch()
    await batch.sendTokensFromBatch()
    await sendTokens.fillTransfer({ recipient: secondRecipient, amount: SECOND_AMOUNT })
    await sendTokens.nextButton.click()
    await review.addToBatch()
    await batch.confirmBatch()
    await expect(review.batchedTransactions).toHaveCount(2)
    await expect(review.batchedTransactions.nth(0)).toContainText(FIRST_AMOUNT)
    await expect(review.batchedTransactions.nth(1)).toContainText(SECOND_AMOUNT)
    await review.signAndExecute()

    await expect
      .poll(async () => multiSendActionCounts(await safeApiClient.getTransactionHistory(safe.address)))
      .toEqual([2])
    expect(await balanceOf(journey.env, firstRecipient)).toBe(parseEther(FIRST_AMOUNT))
    expect(await balanceOf(journey.env, secondRecipient)).toBe(parseEther(SECOND_AMOUNT))

    await new HomePage(safePage).goto(safe.prefixedAddress)
    await batch.openButton.click()
    await expect(batch.emptyBatch).toBeVisible()
  })
})
