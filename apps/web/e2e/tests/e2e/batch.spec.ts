import { Wallet, parseEther } from 'ethers'
import type { TransactionItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { BatchSidebarPage } from '../../src/pages/batch-sidebar.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

const FIRST_AMOUNT = '0.001'
const SECOND_AMOUNT = '0.002'

function multiSendActionCounts(history: TransactionItemPage): number[] {
  return transactionsIn(history).flatMap(({ txInfo }) =>
    txInfo.type === 'Custom' && 'actionCount' in txInfo ? [txInfo.actionCount] : [],
  )
}

test.describe('Execute a batch', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should pay every batched recipient in one multisend when an owner executes the batch', async ({
    safePage,
    safeApiClient,
    journey,
  }, testInfo) => {
    const [firstRecipient, secondRecipient] = [Wallet.createRandom().address, Wallet.createRandom().address]
    const safe = await seedSafe(journey, { threshold: 1 })
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const batch = new BatchSidebarPage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
    await batch.sendTokensFromEmptyBatch()
    await sendTokens.fillTransfer({ recipient: firstRecipient, amount: FIRST_AMOUNT })
    await sendTokens.nextButton.click()
    await review.addToBatch()
    await batch.sendTokensFromBatch()
    await sendTokens.fillTransfer({ recipient: secondRecipient, amount: SECOND_AMOUNT })
    await sendTokens.nextButton.click()
    await review.addToBatch()
    await batch.confirmBatch()
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect
      .poll(async () => multiSendActionCounts(await safeApiClient.getTransactionHistory(safe.address)))
      .toEqual([2])
    expect(await balanceOf(journey.env, firstRecipient)).toBe(parseEther(FIRST_AMOUNT))
    expect(await balanceOf(journey.env, secondRecipient)).toBe(parseEther(SECOND_AMOUNT))

    await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
    await batch.openButton.click()
    await expect(batch.emptyBatch).toBeVisible()
  })
})
