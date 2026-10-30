import { Wallet } from 'ethers'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { nonceOf, transactionsIn } from '../../src/api/transaction-items'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { TxBuilderPage } from '../../src/pages/tx-builder.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { BASIC_TYPES_TEST_CONTRACT, seedTransactionBuilderContracts } from '../../src/seed/safe-apps'
import { seedSafe } from '../../src/seed/safe'

/** The decoded call of the executed transaction at `nonce`, as CGW reports it */
async function executedCall(
  safeApiClient: SafeApiClient,
  safeAddress: string,
  nonce: number,
): Promise<{ to?: string; method?: string; argument?: unknown } | undefined> {
  const executed = transactionsIn(await safeApiClient.getTransactionHistory(safeAddress)).find(
    (tx) => nonceOf(tx) === nonce,
  )
  if (!executed) return undefined
  const txData = (await safeApiClient.findTransaction(executed.id))?.txData
  return {
    to: txData?.to.value,
    method: txData?.dataDecoded?.method,
    argument: txData?.dataDecoded?.parameters?.[0]?.value,
  }
}

test.describe('Transaction Builder', { tag: '@e2e' }, () => {
  test('should execute the call that Transaction Builder sends when an owner signs it in the wallet', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const newValue = Wallet.createRandom().address
    await seedTransactionBuilderContracts(journey)
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const builder = new TxBuilderPage(safePage)
    const review = new TxReviewPage(safePage)
    await builder.open(safe.prefixedAddress)
    await builder.sendCall({ contract: BASIC_TYPES_TEST_CONTRACT, method: 'testAddressValue', argument: newValue })
    await review.signAndExecute()

    await expect
      .poll(() => executedCall(safeApiClient, safe.address, 0))
      .toEqual({ to: BASIC_TYPES_TEST_CONTRACT, method: 'testAddressValue', argument: newValue })
  })
})
