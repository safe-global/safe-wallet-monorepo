import { getAddress } from 'ethers'
import type { SafeApiClient } from '../../src/api/safe-api-client'
import { fundBalance } from '../../src/chain/balances'
import { readSafeSetup } from '../../src/chain/recovery'
import { senderOf } from '../../src/chain/transactions'
import { RELAYER } from '../../src/data/constants'
import { test, expect, type JourneyEnvironment } from '../../src/fixtures/journey.fixture'
import { CreateSafePage } from '../../src/pages/create-safe.page'

/** The account that sent the transaction that deployed the Safe; null until CGW has indexed the creation */
async function deployerOf(
  safeApiClient: SafeApiClient,
  env: JourneyEnvironment,
  safeAddress: string,
): Promise<string | null> {
  const creationTxHash = await safeApiClient.findCreationTxHash(safeAddress)
  if (!creationTxHash) return null
  return senderOf(env, creationTxHash)
}

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

  test('should deploy the Safe at creation from the relayer account when the owner has ETH but pays now with the relay', async ({
    safePage,
    safeApiClient,
    journey,
  }) => {
    const { alice } = journey.owners
    await fundBalance(journey.env, alice.address)
    const create = new CreateSafePage(safePage)

    const address = getAddress(await create.createPayNowSafeWithRelay())
    journey.recordSafe({ prefixedAddress: `sep:${address}` })

    const expected = { owners: [alice.address], threshold: 1 }
    const onChain = await readSafeSetup(journey.env, address)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual(expected)
    await expect.poll(() => deployerOf(safeApiClient, journey.env, address)).toBe(RELAYER)
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

    const address = getAddress(await create.createPayNowSafeWithWallet())
    journey.recordSafe({ prefixedAddress: `sep:${address}` })

    const expected = { owners: [alice.address], threshold: 1 }
    const onChain = await readSafeSetup(journey.env, address)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual(expected)
    await expect.poll(() => deployerOf(safeApiClient, journey.env, address)).toBe(alice.address.toLowerCase())
    await expect(create.activationSection).toBeHidden()
  })
})
