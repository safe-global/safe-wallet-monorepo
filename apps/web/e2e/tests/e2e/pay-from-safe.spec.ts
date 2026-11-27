import { parseEther, parseUnits } from 'ethers'
import { confirmationsOf } from '../../src/api/transaction-items'
import { balanceOf, emptyBalance, tokenBalanceOf } from '../../src/chain/balances'
import { refundPaidIn } from '../../src/chain/refund'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxHistoryPage } from '../../src/pages/tx-history.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedProposer } from '../../src/seed/proposers'
import { seedSafe } from '../../src/seed/safe'
import { SEPOLIA_USDC, seedTokenBalance, waitForNativeBalance } from '../../src/seed/tokens'

const AMOUNT = '0.001'
const FEE_SERVICE_MOCK_QUOTE = {
  fiatFee: '0.42',
  gasPrice: '2000000000',
  refundReceiver: '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD',
}
const USDC_BALANCE = parseUnits('25', SEPOLIA_USDC.decimals)
// 110,000 gas at 1 base unit of USDC per gas
const FEE_SERVICE_MOCK_USDC_QUOTE = { gasPrice: '1', maxFee: '0.11 USDC' }
const SIGNED_WITH_QUOTED_FEES = {
  detailedExecutionInfo: {
    gasPrice: FEE_SERVICE_MOCK_QUOTE.gasPrice,
    refundReceiver: { value: FEE_SERVICE_MOCK_QUOTE.refundReceiver },
  },
}

test.describe('Pay from Safe', { tag: '@e2e' }, () => {
  test('should execute a transfer of a 1/1 Safe whose owner has no ETH, with the gas refunded from the Safe, and show it as paid from the Safe account in the history', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const owner = journey.owners.alice.address
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const recipient = journey.newAddress()
    await emptyBalance(journey.env, owner)
    const safeBalance = await balanceOf(journey.env, safe.address)
    await journey.connectAs('alice')

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, { recipient, amount: AMOUNT })
    await review.payFeesFromSafe()
    await expect(review.gasFeeRow).toContainText(FEE_SERVICE_MOCK_QUOTE.fiatFee)
    await review.sign()
    await expect(review.lockedFeePayer).toHaveText('Safe account')
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject(SIGNED_WITH_QUOTED_FEES)
    const refund = await refundPaidIn(journey.env, await safeApiClient.getExecutionTxHash(safe.address, 0))
    expect(refund).toBeGreaterThan(0n)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, safe.address)).toBe(safeBalance - parseEther(AMOUNT) - refund)
    expect(await balanceOf(journey.env, owner)).toBe(0n)
    const history = new TxHistoryPage(safePage)
    await history.goto(safe.prefixedAddress)
    await history.expand(history.transactionsLabelled('Sent'))
    await expect(history.feesPayer).toHaveText('Paid from Safe account')
  })

  test('should refund the gas in USDC, and leave the ETH of the Safe to the transfer, when the owner picks USDC as the fees token', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const usdc = SEPOLIA_USDC.address
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const recipient = journey.newAddress()
    await seedTokenBalance(safe, { token: SEPOLIA_USDC, amount: USDC_BALANCE })
    await emptyBalance(journey.env, journey.owners.alice.address)
    const safeBalance = await balanceOf(journey.env, safe.address)
    const collectorUsdc = await tokenBalanceOf(journey.env, {
      token: usdc,
      holder: FEE_SERVICE_MOCK_QUOTE.refundReceiver,
    })
    await journey.connectAs('alice')

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, { recipient, amount: AMOUNT })
    await review.payFeesFromSafe()
    await review.payFeesIn(SEPOLIA_USDC.symbol)
    await expect(review.gasFeeRow).toContainText(FEE_SERVICE_MOCK_USDC_QUOTE.maxFee)
    await review.sign()
    await expect(review.lockedFeePayer).toHaveText('Safe account')
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject({
        detailedExecutionInfo: {
          gasPrice: FEE_SERVICE_MOCK_USDC_QUOTE.gasPrice,
          gasToken: usdc,
          refundReceiver: { value: FEE_SERVICE_MOCK_QUOTE.refundReceiver },
        },
      })
    const refund = await refundPaidIn(journey.env, await safeApiClient.getExecutionTxHash(safe.address, 0))
    expect(refund).toBeGreaterThan(0n)
    expect(await tokenBalanceOf(journey.env, { token: usdc, holder: safe.address })).toBe(USDC_BALANCE - refund)
    expect(await tokenBalanceOf(journey.env, { token: usdc, holder: FEE_SERVICE_MOCK_QUOTE.refundReceiver })).toBe(
      collectorUsdc + refund,
    )
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, safe.address)).toBe(safeBalance - parseEther(AMOUNT))
  })

  test('should keep the Safe as the payer for the owner who confirms and executes a 2/2 transfer without ETH', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const executor = journey.owners.bob.address
    const safe = await seedSafe(journey, { owners: ['bob', 'alice'], threshold: 2 })
    const recipient = journey.newAddress()
    await emptyBalance(journey.env, executor)
    await journey.connectAs('alice')

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, { recipient, amount: AMOUNT })
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
    expect(await refundPaidIn(journey.env, await safeApiClient.getExecutionTxHash(safe.address, 0))).toBeGreaterThan(0n)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, executor)).toBe(0n)
  })

  test('should lock the Safe account as the payer for the owner who signs and executes a transfer that a proposer proposed with the fees paid from the Safe', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const recipient = journey.newAddress()
    await seedProposer(safe, { delegate: journey.owners.dave, delegator: journey.owners.alice })
    await waitForNativeBalance(safe)
    const safeBalance = await balanceOf(journey.env, safe.address)
    await journey.connectAs('dave')

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, { recipient, amount: AMOUNT })
    await review.payFeesFromSafe()
    await review.propose()
    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([0])

    await journey.connectAs('alice')
    const queue = new TxQueuePage(safePage)
    await queue.goto(safe.prefixedAddress)
    await queue.confirm(0)
    await expect(review.lockedFeePayer).toHaveText('Safe account')
    await review.sign()
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject(SIGNED_WITH_QUOTED_FEES)
    const refund = await refundPaidIn(journey.env, await safeApiClient.getExecutionTxHash(safe.address, 0))
    expect(refund).toBeGreaterThan(0n)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, safe.address)).toBe(safeBalance - parseEther(AMOUNT) - refund)
  })
})
