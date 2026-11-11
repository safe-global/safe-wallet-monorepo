import { Wallet, parseEther } from 'ethers'
import type { Page } from '@playwright/test'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { confirmationsOf } from '../../src/api/transaction-items'
import { balanceOf, emptyBalance } from '../../src/chain/balances'
import { refundPaidIn } from '../../src/chain/refund'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe, type SeededSafe } from '../../src/seed/safe'

const AMOUNT = '0.001'
const FEE_SERVICE_MOCK_QUOTE = {
  fiatFee: '0.42',
  gasPrice: '2000000000',
  refundReceiver: '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD',
}
const SIGNED_WITH_QUOTED_FEES = {
  detailedExecutionInfo: {
    gasPrice: FEE_SERVICE_MOCK_QUOTE.gasPrice,
    refundReceiver: { value: FEE_SERVICE_MOCK_QUOTE.refundReceiver },
  },
}

async function createTransfer(page: Page, safe: SeededSafe, recipient: string): Promise<TxReviewPage> {
  const sendTokens = new SendTokensPage(page)
  await new HomePage(page).goto(safe.prefixedAddress)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
  return new TxReviewPage(page)
}

async function executionTxHash(safeApiClient: SafeApiClient, safeAddress: string, nonce: number): Promise<string> {
  const txHash = (await safeApiClient.findExecutedTransaction(safeAddress, nonce))?.txHash
  if (!txHash) throw new Error(`CGW has no execution hash for nonce ${nonce} of ${safeAddress}`)
  return txHash
}

test.describe('Pay from Safe', { tag: '@e2e' }, () => {
  test('should execute a transfer of a 1/1 Safe whose owner has no ETH, with the gas refunded from the Safe', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const owner = journey.owners.alice.address
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await emptyBalance(journey.env, owner)
    const safeBalance = await balanceOf(journey.env, safe.address)
    await journey.connectAs('alice')

    const review = await createTransfer(safePage, safe, recipient)
    await review.payFeesFromSafe()
    await expect(review.gasFeeRow).toContainText(FEE_SERVICE_MOCK_QUOTE.fiatFee)
    await review.sign()
    await expect(review.lockedFeePayer).toHaveText('Safe account')
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject(SIGNED_WITH_QUOTED_FEES)
    const refund = await refundPaidIn(journey.env, await executionTxHash(safeApiClient, safe.address, 0))
    expect(refund).toBeGreaterThan(0n)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, safe.address)).toBe(safeBalance - parseEther(AMOUNT) - refund)
    expect(await balanceOf(journey.env, owner)).toBe(0n)
  })

  test('should keep the Safe as the payer for the owner who confirms and executes a 2/2 transfer without ETH', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const executor = journey.owners.bob.address
    const safe = await seedSafe(journey, { owners: ['bob', 'alice'], threshold: 2 })
    await emptyBalance(journey.env, executor)
    await journey.connectAs('alice')

    const review = await createTransfer(safePage, safe, recipient)
    await review.payFeesFromSafe()
    await expect(review.gasFeeRow).toContainText(FEE_SERVICE_MOCK_QUOTE.fiatFee)
    await review.sign()
    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])
    const queue = new TxQueuePage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')

    await journey.connectAs('bob')
    await queue.confirm(0)
    await expect(review.lockedFeePayer).toHaveText('Safe account')
    await review.continueButton.click()
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject(SIGNED_WITH_QUOTED_FEES)
    expect(await refundPaidIn(journey.env, await executionTxHash(safeApiClient, safe.address, 0))).toBeGreaterThan(0n)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, executor)).toBe(0n)
  })
})
