import { parseEther } from 'ethers'
import { recipientsAtNonce } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const AMOUNT = '0.001'
const REPLACEMENT_AMOUNT = '0.002'

test.describe('Replace a queued transaction', { tag: '@e2e' }, () => {
  test('should execute the replacement at the nonce of the original when an owner replaces it', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice', 'bob'], threshold: 1 })
    const [recipient, newRecipient] = [journey.newAddress(), journey.newAddress()]
    const original = await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: AMOUNT })

    const queue = new TxQueuePage(safePage)
    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.openTransaction(safe.prefixedAddress, original.txId)
    await queue.replace()
    await sendTokens.fillTransfer({ recipient: newRecipient, amount: REPLACEMENT_AMOUNT })
    await sendTokens.nextButton.click()
    await review.signAndExecute()

    await expect
      .poll(async () => recipientsAtNonce(await safeApiClient.getTransactionHistory(safe.address), 0))
      .toEqual([newRecipient])
    await expect.poll(() => safeApiClient.getQueued(safe.address)).toEqual([])
    expect(await balanceOf(journey.env, newRecipient)).toBe(parseEther(REPLACEMENT_AMOUNT))
    expect(await balanceOf(journey.env, recipient)).toBe(0n)

    await queue.goto(safe.prefixedAddress)
    await expect(queue.emptyQueue).toBeVisible()
  })
})
