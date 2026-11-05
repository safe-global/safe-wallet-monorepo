import { Wallet, parseEther } from 'ethers'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { confirmationsOf, nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { balanceOf, emptyBalance } from '../../src/chain/balances'
import { refundPaidIn } from '../../src/chain/refund'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe, type SeededSafe } from '../../src/seed/safe'
import type { Page } from '@playwright/test'

const AMOUNT = '0.001'
// The quote of the stack's fee service mock (environment/infra/mocks/fee-service.ts)
const QUOTED_FIAT_FEE = '0.42'
const QUOTED_GAS_PRICE = '2000000000'
const FEE_COLLECTOR = '0x53b3BDD8dB8352D9aB7bF39A527F9C24fC404DcD'

type Execution = { txHash: string; gasPrice: string; refundReceiver: string }

/** The on-chain execution of the multisig transaction at `nonce` and the fee params it was signed with, from CGW */
async function findExecution(
  safeApiClient: SafeApiClient,
  safeAddress: string,
  nonce: number,
): Promise<Execution | undefined> {
  const executed = transactionsIn(await safeApiClient.getTransactionHistory(safeAddress)).find(
    (tx) => nonceOf(tx) === nonce,
  )
  if (!executed) return undefined
  const details = await safeApiClient.findTransaction(executed.id)
  const execution = details?.detailedExecutionInfo
  if (!details?.txHash || execution?.type !== 'MULTISIG') return undefined
  return { txHash: details.txHash, gasPrice: execution.gasPrice, refundReceiver: execution.refundReceiver.value }
}

/** Wait until CGW lists the execution of the multisig transaction at `nonce` */
async function executionOfNonce(safeApiClient: SafeApiClient, safeAddress: string, nonce: number): Promise<Execution> {
  await expect.poll(() => findExecution(safeApiClient, safeAddress, nonce)).toBeDefined()
  const execution = await findExecution(safeApiClient, safeAddress, nonce)
  if (!execution) throw new Error(`CGW no longer lists the execution of nonce ${nonce} of ${safeAddress}`)
  return execution
}

/** Open the Safe and create a transfer up to its review */
async function createTransfer(page: Page, safe: SeededSafe, recipient: string): Promise<TxReviewPage> {
  const sendTokens = new SendTokensPage(page)
  await new HomePage(page).goto(safe.prefixedAddress)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
  return new TxReviewPage(page)
}

/** Sign the reviewed transfer with the Safe account as the payer, once the fee service quoted the fee */
async function signPayingFromSafe(review: TxReviewPage): Promise<void> {
  await review.payFeesFromSafe()
  await expect(review.gasFeeRow).toContainText(QUOTED_FIAT_FEE)
  await review.sign()
}

test.describe('Pay from Safe', { tag: '@e2e' }, () => {
  test('should execute a transfer of a 1/1 Safe whose owner has no ETH, with the gas refunded from the Safe', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const owner = journey.owners.owner4.address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    await emptyBalance(journey.env, owner)
    const safeBalance = await balanceOf(journey.env, safe.address)

    const review = await createTransfer(safePage, safe, recipient)
    await signPayingFromSafe(review)
    await expect(review.lockedFeePayer).toHaveText('Safe account')
    await review.executeButton.click()
    await review.waitForExecution()

    const execution = await executionOfNonce(safeApiClient, safe.address, 0)
    expect(execution).toMatchObject({ gasPrice: QUOTED_GAS_PRICE, refundReceiver: FEE_COLLECTOR })
    const refund = await refundPaidIn(journey.env, execution.txHash)
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
    const executor = journey.owners.owner1.address
    const safe = await seedSafe(journey, { owners: ['owner1', 'owner4'], threshold: 2 })
    await emptyBalance(journey.env, executor)

    const review = await createTransfer(safePage, safe, recipient)
    await signPayingFromSafe(review)
    await expect.poll(async () => (await safeApiClient.getQueued(safe.address)).map(confirmationsOf)).toEqual([1])
    const queue = new TxQueuePage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')

    await journey.connectAs('owner1')
    await queue.confirm(0)
    await expect(review.lockedFeePayer).toHaveText('Safe account')
    await review.continueButton.click()
    await review.executeButton.click()
    await review.waitForExecution()

    const execution = await executionOfNonce(safeApiClient, safe.address, 0)
    expect(execution).toMatchObject({ gasPrice: QUOTED_GAS_PRICE, refundReceiver: FEE_COLLECTOR })
    expect(await refundPaidIn(journey.env, execution.txHash)).toBeGreaterThan(0n)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    expect(await balanceOf(journey.env, executor)).toBe(0n)
  })
})
