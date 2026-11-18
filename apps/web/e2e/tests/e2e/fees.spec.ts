import { Wallet, parseUnits } from 'ethers'
import { maxFeePerGasOf } from '../../src/chain/transactions'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxHistoryPage } from '../../src/pages/tx-history.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedExecutedTransfer, seedSafe } from '../../src/seed/safe'

const AMOUNT = '0.001'
const MAX_FEE_GWEI = '3'

test.describe('Fees of a transaction', { tag: '@e2e' }, () => {
  test('should send the execution with the max fee that the owner sets in the fee card', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient: Wallet.createRandom().address, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.sign()
    await review.payFeesFromSignerWallet()
    await review.setMaxFee(MAX_FEE_GWEI)
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject({ txStatus: 'SUCCESS' })
    const execution = await safeApiClient.getExecutionTxHash(safe.address, 0)
    expect(await maxFeePerGasOf(journey.env, execution)).toBe(parseUnits(MAX_FEE_GWEI, 'gwei'))
  })

  test('should show the fees as paid from the signer wallet in the history of a transfer that an owner executed', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await seedExecutedTransfer(safe, { recipient: Wallet.createRandom().address, amount: AMOUNT })

    const history = new TxHistoryPage(safePage)
    await history.goto(safe.prefixedAddress)
    await history.expand(history.transactionsLabelled('Sent'))

    await expect(history.feesPayer).toHaveText('Paid from signer wallet')
  })
})
