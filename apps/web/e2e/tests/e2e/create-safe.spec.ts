import { getAddress } from 'ethers'
import { readSafeSetup } from '../../src/chain/recovery'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { CreateSafePage } from '../../src/pages/create-safe.page'

test.describe('Create a Safe', { tag: '@e2e' }, () => {
  test('should deploy the Safe with the owner as its only signer when the owner creates it and pays later', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { owner4 } = journey.owners
    const create = new CreateSafePage(safePage)

    const address = getAddress(await create.createPayLaterSafe())
    journey.recordSafe({ prefixedAddress: `sep:${address}` })
    await expect(create.activationSection).toBeVisible()

    await create.activate()

    const expected = { owners: [owner4.address], threshold: 1 }
    const onChain = await readSafeSetup(journey.env, address)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual(expected)
    await expect
      .poll(async () => {
        const { owners, threshold } = await safeApiClient.getSafeInfo(address)
        return { owners: owners.map((owner) => owner.value), threshold }
      })
      .toEqual(expected)
    await expect(create.activationSection).toBeHidden()
  })
})
