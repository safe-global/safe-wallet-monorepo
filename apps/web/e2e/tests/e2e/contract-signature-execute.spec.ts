import { Wallet, parseEther } from 'ethers'
import { balanceOf } from '../../src/chain/balances'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedTransferWithContractSignature } from '../../src/seed/signatures'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'

const AMOUNT = '0.001'

test.describe('Execute a transaction that an owner Safe confirmed', { tag: '@e2e' }, () => {
  test('should execute a transfer confirmed by an EOA signature and an EIP-1271 contract signature', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedTransferWithContractSignature(journey, { recipient, amount: AMOUNT })

    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('2/2')
    await queue.execute(0)
    await review.continueAndExecute()
    await review.waitForExecution()

    await expect.poll(async () => (await safeApiClient.getSafeInfo(safe.address)).nonce).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })
})
