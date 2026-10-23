import { readSafeSetup } from '../../src/chain/recovery'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { NestedSafesPage } from '../../src/pages/nested-safes.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe } from '../../src/seed/safe'

test.describe('Create a nested Safe', { tag: '@e2e' }, () => {
  test('should deploy a Safe that the parent Safe owns when an owner creates a nested Safe', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const parent = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const nestedSafes = new NestedSafesPage(safePage)
    const review = new TxReviewPage(safePage)
    await new HomePage(safePage).goto(parent.prefixedAddress)
    await nestedSafes.create('Payroll')
    await review.signAndExecute()

    await expect.poll(() => safeApiClient.getOwnedSafes(parent.address)).toHaveLength(1)
    const [nested] = await safeApiClient.getOwnedSafes(parent.address)
    journey.recordSafe({ prefixedAddress: `sep:${nested}` })
    const onChain = await readSafeSetup(journey.env, nested)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual({ owners: [parent.address], threshold: 1 })
  })
})
