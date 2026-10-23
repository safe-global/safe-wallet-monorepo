import { forkEnvironment } from '../../src/chain/local-provider'
import { readSafeSetup } from '../../src/chain/recovery'
import { multichainSingleton, readSingleton } from '../../src/chain/singleton'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { CreateSafePage } from '../../src/pages/create-safe.page'
import { HomePage } from '../../src/pages/home.page'
import { NetworkSelector } from '../../src/pages/network-selector.page'
import { seedSafe, upgradeToSafe150 } from '../../src/seed/safe'

const ETHEREUM = 1

test.describe('Add a Safe to another network', { tag: '@e2e' }, () => {
  test('should deploy a 1.4.1 Safe upgraded to 1.5.0 on Ethereum at its address, with the 1.4.1 setup of its creation', async ({
    safePage,
    journey,
  }) => {
    // Each activation waits until the gateway indexes the deployment
    test.slow()
    const { owner4 } = journey.owners
    const safe = await seedSafe(journey, { owners: ['owner4'], threshold: 1, safeVersion: '1.4.1', multichain: true })
    await upgradeToSafe150(safe)

    const networkSelector = new NetworkSelector(safePage)
    await new HomePage(safePage).goto(safe.prefixedAddress)
    await networkSelector.addNetwork('Ethereum')
    await networkSelector.switchTo('Ethereum')
    await new CreateSafePage(safePage).activate({ switchWalletTo: 'Ethereum' })

    const ethereum = forkEnvironment(journey.env, ETHEREUM)
    const { owners, threshold } = await readSafeSetup(ethereum, safe.address)
    expect({ owners, threshold }).toEqual({ owners: [owner4.address], threshold: 1 })
    expect(await readSingleton(ethereum, safe.address)).toEqual({
      version: '1.4.1',
      singleton: multichainSingleton(ETHEREUM, '1.4.1'),
    })
    expect((await readSingleton(journey.env, safe.address)).version).toBe('1.5.0')
  })
})
