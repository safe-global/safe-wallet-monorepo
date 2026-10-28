import { parseEther } from 'ethers'
import { balanceOf } from '../../src/chain/balances'
import { readSafeSetup } from '../../src/chain/recovery'
import { test, expect } from '../../src/fixtures/journey.fixture'
import type { Journey } from '../../src/fixtures/journey.fixture'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { HomePage } from '../../src/pages/home.page'
import { NestedSafesPage } from '../../src/pages/nested-safes.page'
import { TxReviewPage } from '../../src/pages/tx-review.page'
import { seedSafe, type SeededSafe } from '../../src/seed/safe'

/** Waits until CGW lists the one Safe that `parent` owns, and names it in the test report. */
async function findDeployedNestedSafe(safeApiClient: SafeApiClient, journey: Journey, parent: SeededSafe) {
  await expect.poll(() => safeApiClient.getOwnedSafes(parent.address)).toHaveLength(1)
  const [nested] = await safeApiClient.getOwnedSafes(parent.address)
  journey.recordSafe({ prefixedAddress: `sep:${nested}` })
  return nested
}

const openedSafe = (url: URL) => url.searchParams.get('safe')

test.describe('Create a nested Safe', { tag: '@e2e' }, () => {
  test('should deploy a Safe that the parent Safe owns when an owner creates a nested Safe', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const name = 'Payroll'
    const parent = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    const home = new HomePage(safePage)
    const nestedSafes = new NestedSafesPage(safePage)
    const review = new TxReviewPage(safePage)
    await home.goto(parent.prefixedAddress)
    await nestedSafes.create(name)
    await review.signAndExecute()

    const nested = await findDeployedNestedSafe(safeApiClient, journey, parent)
    const onChain = await readSafeSetup(journey.env, nested)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual({ owners: [parent.address], threshold: 1 })

    await home.goto(parent.prefixedAddress)
    await nestedSafes.curateOnly(name)
    await safePage.reload()
    await nestedSafes.openButton.click()
    await expect(nestedSafes.manageButton).toBeVisible()
    await expect(nestedSafes.rows).toHaveCount(1)
    await nestedSafes.openSafeLink(name).click()
    await expect(safePage).toHaveURL((url) => openedSafe(url) === `sep:${nested}`)

    await nestedSafes.parentSafeLink.click()
    await expect(safePage).toHaveURL((url) => openedSafe(url) === parent.prefixedAddress)
  })

  test('should deploy the nested Safe and fund it when an owner adds assets', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const parent = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })

    await new HomePage(safePage).goto(parent.prefixedAddress)
    await new NestedSafesPage(safePage).create('Funded', { fund: '0.01' })
    const review = new TxReviewPage(safePage)
    await expect(review.multiSendAction(1)).toContainText('SafeProxyFactory')
    await expect(review.multiSendAction(2)).toContainText(/Send.*0\.01 ETH/)
    await expect(review.multiSendAction(3)).toHaveCount(0)
    await expect(review.transactionDetails).toContainText('multiSend')
    await review.signAndExecute()

    const nested = await findDeployedNestedSafe(safeApiClient, journey, parent)
    const onChain = await readSafeSetup(journey.env, nested)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual({ owners: [parent.address], threshold: 1 })
    expect(await balanceOf(journey.env, nested)).toBe(parseEther('0.01'))
  })
})
