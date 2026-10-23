import { Wallet, parseEther } from 'ethers'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { balanceOf } from '../../src/chain/balances'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { SendTokensPage } from '../../src/pages/send-tokens.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe } from '../../src/seed/safe'

const AMOUNT = '0.001'
// The account that the stack's relay mock (environment/infra/mocks/relay-api.ts) sends every relayed transaction from
const RELAYER = '0x5afe00000000000000000000000000000000beef'

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

test.describe('Execute with the relay', { tag: '@e2e' }, () => {
  test('should execute a transfer from the relayer account when an owner signs and picks the relay', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const recipient = Wallet.createRandom().address
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const sendTokens = new SendTokensPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await sendTokens.open()
    await sendTokens.fillTransfer({ recipient, amount: AMOUNT })
    await sendTokens.nextButton.click()
    await review.sign()
    await expect(review.remainingRelays).toBeVisible()
    await review.executeWithRelay()
    await review.waitForExecution()

    await expect.poll(() => safeApiClient.getNonce(safe.address)).toBe(1)
    expect(await balanceOf(journey.env, recipient)).toBe(parseEther(AMOUNT))
    await expect.poll(() => executorOfNonce(safeApiClient, safe.address, 0)).toBe(RELAYER)
  })
})
