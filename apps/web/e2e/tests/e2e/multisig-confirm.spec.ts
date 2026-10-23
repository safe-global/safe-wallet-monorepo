import { Wallet, parseEther } from 'ethers'
import type { QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { ROUTES } from '../../src/data/constants'

const AMOUNT = '0.001'

function confirmationsOfQueued(queue: QueuedItemPage): Array<number | undefined> {
  return transactionsIn(queue).map((tx) =>
    tx.executionInfo?.type === 'MULTISIG' ? tx.executionInfo.confirmationsSubmitted : undefined,
  )
}

test.describe('Confirm a transaction with a second owner', { tag: '@e2e' }, () => {
  test('should execute a transfer when a second owner confirms the signature of the first', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 2 })

    const sendTokens = new SendTokensPage(safePage)
    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await safePage.goto(`${ROUTES.home}?safe=${safe.prefixedAddress}`)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.sign()

    await expect
      .poll(async () => confirmationsOfQueued(await safeApiClient.getQueuedTransactions(safe.address)))
      .toEqual([1])

    await journey.connectAs('owner1')
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')
    await queue.confirm(0)
    await review.sign()
    await review.execute()
    await review.waitForExecution()

    await expect.poll(async () => (await safeApiClient.getSafeInfo(safe.address)).nonce).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })
})
