import { Wallet, parseEther, parseUnits } from 'ethers'
import { offerGasPaymentOptions } from '../../src/api/chain-config'
import { balanceOf } from '../../src/chain/balances'
import { gasFeesOf } from '../../src/chain/transactions'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxHistoryPage } from '../../src/pages/tx-history.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe } from '../../src/seed/safe'

const AMOUNT = '0.001'
const MAX_PRIORITY_FEE_GWEI = '2'
const MAX_FEE_GWEI = '3'

test.describe('Fees of a transaction', { tag: '@e2e' }, () => {
  test('should send the execution with the max fees that the owner sets in the fee card, and show it as paid from the signer wallet in the history', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, {
      recipient: Wallet.createRandom().address,
      amount: AMOUNT,
    })
    await review.sign()
    await review.payFeesFromSignerWallet()
    await review.setGasFees({ maxPriorityFee: MAX_PRIORITY_FEE_GWEI, maxFee: MAX_FEE_GWEI })
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject({ txStatus: 'SUCCESS' })
    const execution = await safeApiClient.getExecutionTxHash(safe.address, 0)
    expect(await gasFeesOf(journey.env, execution)).toEqual({
      maxPriorityFeePerGas: parseUnits(MAX_PRIORITY_FEE_GWEI, 'gwei'),
      maxFeePerGas: parseUnits(MAX_FEE_GWEI, 'gwei'),
    })
    const history = new TxHistoryPage(safePage)
    await history.goto(safe.prefixedAddress)
    await history.expand(history.transactionsLabelled('Sent'))
    await expect(history.feesPayer).toHaveText('Paid from signer wallet')
  })
})

test.describe('Fees where the relayer does not offer Pay from Safe', { tag: '@e2e' }, () => {
  test('should execute a transfer from the wallet of the owner, the only payer where the relayer sponsors nothing', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const owner = journey.owners.alice.address
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await offerGasPaymentOptions(safePage, [])

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, { recipient, amount: AMOUNT })
    await review.sign()
    await expect(review.lockedFeePayer).toHaveText('Signer wallet')
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject({ detailedExecutionInfo: { executor: { value: owner } } })
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })
})
