import { Wallet, parseEther } from 'ethers'
import type { Page } from '@playwright/test'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { sponsoredTransactionsUsed } from '../../src/fixtures/email-session'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedQueuedTransfer, seedSafe, type SeededSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const AMOUNT = '0.001'
// The account that the stack's relay mock (environment/infra/mocks/relay-api.ts) sends every relayed transaction from
const RELAYER = '0x5afe00000000000000000000000000000000beef'
// FEATURE_SPONSORED_TRANSACTIONS of the Business plan in the billing mock (environment/infra/mocks/billing-api.ts)
const BUSINESS_PLAN_RELAYS = 50

/** The account that sent the executed multisig transaction at `nonce`, as CGW reports it */
async function executorOfNonce(
  safeApiClient: SafeApiClient,
  safeAddress: string,
  nonce: number,
): Promise<string | undefined> {
  const executed = transactionsIn(await safeApiClient.getTransactionHistory(safeAddress)).find(
    (tx) => nonceOf(tx) === nonce,
  )
  if (!executed) return undefined
  const execution = (await safeApiClient.findTransaction(executed.id))?.detailedExecutionInfo
  return execution?.type === 'MULTISIG' ? execution.executor?.value.toLowerCase() : undefined
}

/** Open the Safe, in a Workspace when `spaceId` is given, and sign a transfer up to the choice of who pays the gas */
async function signTransfer(page: Page, safe: SeededSafe, recipient: string, spaceId?: string): Promise<TxReviewPage> {
  const sendTokens = new SendTokensPage(page)
  const review = new TxReviewPage(page)
  await new HomePage(page).goto(safe.prefixedAddress, spaceId)
  await sendTokens.open()
  await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
  await sendTokens.nextButton.click()
  await review.sign({ confirmRisk: !spaceId })
  return review
}

test.describe('Execute with the relay', { tag: '@e2e' }, () => {
  test('should execute a transfer from the relayer account when an owner signs and picks the relay', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const review = await signTransfer(safePage, safe, recipient)
    await expect(review.remainingRelays).toBeVisible()
    await review.executeWithRelay()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await expect.poll(() => executorOfNonce(safeApiClient, safe.address, 0)).toBe(RELAYER)
  })

  test("should spend one of the Workspace plan's sponsored transactions when a Safe in a Business Workspace relays", async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    const workspace = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const review = await signTransfer(safePage, safe, recipient, workspace.id)
    await expect(review.sponsoredTxsCounter).toContainText(
      `${BUSINESS_PLAN_RELAYS}/${BUSINESS_PLAN_RELAYS} sponsored transactions left`,
    )
    await review.executeWithRelay()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await expect.poll(() => executorOfNonce(safeApiClient, safe.address, 0)).toBe(RELAYER)
    expect(await sponsoredTransactionsUsed(workspace.session, workspace.id)).toBe(1)
  })

  test('should collect the signature of the last signer of a 2/2 Safe before the relayer executes', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner1', 'owner4'], threshold: 2 })
    await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: AMOUNT })

    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')
    await queue.confirm(0)
    await review.continueAndExecuteWithRelay()
    await review.waitForExecution()

    // The relayer is no owner, so the transfer executes only with the signature of OWNER_4
    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await expect.poll(() => executorOfNonce(safeApiClient, safe.address, 0)).toBe(RELAYER)
  })
})
