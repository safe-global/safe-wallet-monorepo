import { getAddress } from 'ethers'
import { forkEnvironment } from '../../src/chain/local-provider'
import { readSafeSetup } from '../../src/chain/recovery'
import { multichainSingleton, readSingleton } from '../../src/chain/singleton'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { CreateSafePage } from '../../src/pages/create-safe.page'
import { NetworkSelector } from '../../src/pages/network-selector.page'

const NETWORKS = { Sepolia: 11155111, Ethereum: 1, Polygon: 137 }

test.describe('Create a Safe on several networks', { tag: '@e2e' }, () => {
  test('should deploy the Safe at one address on Sepolia, Ethereum and Polygon, on the L1 singleton only on Ethereum', async ({
    safePage,
    journey,
  }) => {
    // Each activation waits until the gateway indexes the deployment
    test.slow()
    const { owner4 } = journey.owners
    const create = new CreateSafePage(safePage)
    const networkSelector = new NetworkSelector(safePage)

    const address = getAddress(await create.createMultichainPayLaterSafe(Object.keys(NETWORKS)))
    journey.recordSafe({ prefixedAddress: `sep:${address}` })
    await create.activate()
    for (const network of ['Ethereum', 'Polygon']) {
      await networkSelector.switchTo(network)
      await create.activate({ switchWalletTo: network })
    }

    for (const [network, chainId] of Object.entries(NETWORKS)) {
      await test.step(`${network} has the Safe at ${address}`, async () => {
        const env = forkEnvironment(journey.env, chainId)
        const { owners, threshold } = await readSafeSetup(env, address)
        expect({ owners, threshold }).toEqual({ owners: [owner4.address], threshold: 1 })
        const { version, singleton } = await readSingleton(env, address)
        expect(singleton).toBe(multichainSingleton(chainId, version))
      })
    }
  })
})
