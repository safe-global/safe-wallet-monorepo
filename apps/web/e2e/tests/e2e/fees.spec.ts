import { Wallet, parseEther, parseUnits } from 'ethers'
import type { Page } from '@playwright/test'
import { offerGasPaymentOptions } from '../../src/api/chain-config'
import { balanceOf, emptyBalance } from '../../src/chain/balances'
import { maxFeePerGasOf } from '../../src/chain/transactions'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxHistoryPage } from '../../src/pages/tx-history.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedExecutedTransfer, seedSafe, type SeededSafe } from '../../src/seed/safe'

const AMOUNT = '0.001'
const MAX_FEE_GWEI = '3'

async function reviewTransfer(page: Page, safe: SeededSafe, recipient: string): Promise<TxReviewPage> {
  const sendTokens = new SendTokensPage(page)
  await new HomePage(page).goto(safe.prefixedAddress)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
  return new TxReviewPage(page)
}

test.describe('Fees of a transaction', { tag: '@e2e' }, () => {
  test('should send the execution with the max fee that the owner sets in the fee card', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })

    const review = await reviewTransfer(safePage, safe, Wallet.createRandom().address)
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

    const review = await reviewTransfer(safePage, safe, recipient)
    await review.sign()
    await expect(review.lockedFeePayer).toHaveText('Signer wallet')
    await review.executeButton.click()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject({ detailedExecutionInfo: { executor: { value: owner } } })
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })

  test('should execute a transfer of an owner without ETH with the relay where the relayer sponsors free transactions', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const owner = journey.owners.alice.address
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await emptyBalance(journey.env, owner)
    await offerGasPaymentOptions(safePage, ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'])

    const review = await reviewTransfer(safePage, safe, recipient)
    await review.sign()
    await review.executeWithRelay()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, owner)).toBe(0n)
  })

  test('should execute a transfer from the wallet of an owner who declines the free transaction', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const owner = journey.owners.alice.address
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    await offerGasPaymentOptions(safePage, ['FREE_DAILY_LIMIT', 'SUBSCRIPTION'])

    const review = await reviewTransfer(safePage, safe, recipient)
    await review.sign()
    await review.executeDecliningSponsor()
    await review.waitForExecution()

    await expect
      .poll(() => safeApiClient.findExecutedTransaction(safe.address, 0))
      .toMatchObject({ detailedExecutionInfo: { executor: { value: owner } } })
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
  })
})
