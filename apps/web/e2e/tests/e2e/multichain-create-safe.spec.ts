import { getAddress } from 'ethers'
import { getSafeL2SingletonDeployment } from '@safe-global/safe-deployments'
import { readSafeSetup } from '../../src/chain/recovery'
import { readSingleton } from '../../src/chain/singleton'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { CreateSafePage } from '../../src/pages/create-safe.page'

const SEPOLIA = '11155111'

test.describe('Create a Safe on several networks', { tag: '@e2e' }, () => {
  test('should deploy the Sepolia Safe on the L2 singleton when the owner creates it on Sepolia, Ethereum and Polygon', async ({
    safePage,
    journey,
  }) => {
    const { owner4 } = journey.owners
    const create = new CreateSafePage(safePage)

    const address = getAddress(await create.createMultichainPayLaterSafe(['Sepolia', 'Ethereum', 'Polygon']))
    journey.recordSafe({ prefixedAddress: `sep:${address}` })
    await create.activate()

    const onChain = await readSafeSetup(journey.env, address)
    expect({ owners: onChain.owners, threshold: onChain.threshold }).toEqual({ owners: [owner4.address], threshold: 1 })
    const { version, singleton } = await readSingleton(journey.env, address)
    const l2Singleton = getSafeL2SingletonDeployment({ network: SEPOLIA, version })?.networkAddresses[SEPOLIA]
    expect(singleton).toBe(l2Singleton)
  })
})
