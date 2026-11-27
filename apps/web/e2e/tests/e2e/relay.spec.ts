import { parseEther } from 'ethers'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { balanceOf, emptyBalance } from '../../src/chain/balances'
import { RELAYER } from '../../src/data/constants'
import { sponsoredTransactionsUsed } from '../../src/fixtures/email-session'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxQueuePage } from '../../src/pages/tx-queue.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const AMOUNT = '0.001'
// FEATURE_SPONSORED_TRANSACTIONS of the Business plan in the billing mock (environment/infra/mocks/billing-api.ts)
const BUSINESS_PLAN_RELAYS = 50

/** The account that sent the executed multisig transaction at `nonce`, as CGW reports it */
async function executorOfNonce(
  safeApiClient: SafeApiClient,
  safeAddress: string,
  nonce: number,
): Promise<string | undefined> {
  const execution = (await safeApiClient.findExecutedTransaction(safeAddress, nonce))?.detailedExecutionInfo
  return execution?.type === 'MULTISIG' ? execution.executor?.value.toLowerCase() : undefined
}

test.describe('Execute with the relay', { tag: '@e2e' }, () => {
  test('should execute a transfer from the relayer account when an owner without ETH signs and picks the relay', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const owner = journey.owners.alice.address
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const recipient = journey.newAddress()
    await emptyBalance(journey.env, owner)

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, { recipient, amount: AMOUNT })
    await review.sign()
    await expect(review.remainingRelays).toBeVisible()
    await review.executeWithRelay()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await expect.poll(() => executorOfNonce(safeApiClient, safe.address, 0)).toBe(RELAYER)
    expect(await balanceOf(journey.env, owner)).toBe(0n)
  })

  test("should spend one of the Workspace plan's sponsored transactions when a Safe in a Business Workspace relays", async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['alice'], threshold: 1 })
    const recipient = journey.newAddress()
    const workspace = await seedBusinessWorkspace(safePage, { Treasury: safe })

    const review = new TxReviewPage(safePage)
    await new SendTokensPage(safePage).reviewTransfer(safe, { recipient, amount: AMOUNT }, workspace.id)
    await review.sign()
    await expect(review.sponsoredTxsCounter).toContainText(
      `${BUSINESS_PLAN_RELAYS} sponsored transactions left this month`,
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
    const safe = await seedSafe(journey, { owners: ['bob', 'alice'], threshold: 2 })
    const recipient = journey.newAddress()
    await seedQueuedTransfer(safe, { nonce: 0, recipient, amount: AMOUNT })

    const queue = new TxQueuePage(safePage)
    const review = new TxReviewPage(safePage)
    await queue.goto(safe.prefixedAddress)
    await expect(queue.transactionWithNonce(0)).toContainText('1/2')
    await queue.confirm(0)
    await review.continueAndExecuteWithRelay()
    await review.waitForExecution()

    // The relayer is no owner, so the transfer executes only with the signature of Alice
    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await expect.poll(() => executorOfNonce(safeApiClient, safe.address, 0)).toBe(RELAYER)
  })
})
