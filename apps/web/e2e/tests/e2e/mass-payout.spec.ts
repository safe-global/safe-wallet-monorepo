import { Wallet, parseEther } from 'ethers'
import { multiSendActionCounts } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { HomePage } from '../../src/pages/home.page'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const AMOUNTS = ['0.001', '0.002', '0.003']

test.describe('Mass payout', { tag: '@e2e' }, () => {
  test('should pay every recipient its amount in one transaction when an owner sends to three', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const payouts = AMOUNTS.map((amount) => ({ recipient: Wallet.createRandom().address, amount }))
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    for (const [row, payout] of payouts.entries()) {
      if (row > 0) await sendTokens.addRecipientButton.click()
      await sendTokens.fillTransferAt(row, payout)
    }
    await sendTokens.nextButton.click()
    await review.signAndExecute()

    await expect
      .poll(() => Promise.all(payouts.map(({ recipient }) => balanceOf(journey.env, recipient))))
      .toEqual(AMOUNTS.map((amount) => parseEther(amount)))
    await expect
      .poll(async () => multiSendActionCounts(await safeApiClient.getTransactionHistory(safe.address)))
      .toEqual([payouts.length])

    const queue = new TxQueuePage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.emptyQueue).toBeVisible()
  })
})
