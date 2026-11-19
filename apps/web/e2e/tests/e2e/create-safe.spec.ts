import { getAddress } from 'ethers'
import { fundBalance } from '../../src/chain/balances'
import { readSafeSetup } from '../../src/chain/recovery'
import { senderOf } from '../../src/chain/transactions'
import { RELAYER } from '../../src/data/constants'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { CreateSafePage } from '../../src/pages/create-safe.page'

test.describe('Create a Safe', { tag: '@e2e' }, () => {
  test('should deploy the Safe with the owner as its only signer when the owner creates it and pays later', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { alice } = journey.owners
    const create = new CreateSafePage(safePage)

    const address = getAddress(await create.createPayLaterSafe())
    journey.recordSafe({ prefixedAddress: `sep:${address}` })
    await expect(create.activationSection).toBeVisible()

    await create.activate()

    const expected = { owners: [alice.address], threshold: 1 }
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

  test('should deploy the Safe at creation from the relayer account when the owner pays now with the relay', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { alice } = journey.owners
    await fundBalance(journey.env, alice.address)
    const create = new CreateSafePage(safePage)

    const address = getAddress(await create.createPayNowSafe('relay'))
    journey.recordSafe({ prefixedAddress: `sep:${address}` })

    const onChain = await readSafeSetup(journey.env, address)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual({ owners: [alice.address], threshold: 1 })
    await expect
      .poll(async () => {
        const creationTxHash = await safeApiClient.findCreationTxHash(address)
        return creationTxHash && senderOf(journey.env, creationTxHash)
      })
      .toBe(RELAYER)
    await expect(create.activationSection).toBeHidden()
  })

  test('should deploy the Safe at creation from the owner wallet when the owner pays now with the wallet', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { alice } = journey.owners
    await fundBalance(journey.env, alice.address)
    const create = new CreateSafePage(safePage)

    const address = getAddress(await create.createPayNowSafe('wallet'))
    journey.recordSafe({ prefixedAddress: `sep:${address}` })

    const onChain = await readSafeSetup(journey.env, address)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual({ owners: [alice.address], threshold: 1 })
    await expect
      .poll(async () => {
        const creationTxHash = await safeApiClient.findCreationTxHash(address)
        return creationTxHash && senderOf(journey.env, creationTxHash)
      })
      .toBe(alice.address.toLowerCase())
    await expect(create.activationSection).toBeHidden()
  })
})
