import { test, expect } from '../../src/fixtures/isolated.fixture'
import { seedConnectedWallet } from '../../src/fixtures/seed-wallet'
import { HomePage } from '../../src/pages/home.page'
import { WalletPage } from '../../src/pages/wallet.page'

test.use({ scenarioName: 'prepareBasicScenario' })

test.describe('Dashboard on the local stack', { tag: '@isolated' }, () => {
  test('that the local gateway serves the Safe the scenario deployed', async ({ scenario, owners, safeApiClient }) => {
    const [, address] = scenario.safes.static.SEP_STATIC_SAFE_0.split(':')

    const info = await safeApiClient.getSafeInfo(address)

    expect(info.threshold).toBe(1)
    expect(info.owners.map(({ value }) => value)).toEqual([owners.owner4.address])
  })

  test('that the owner opens the dashboard with a connected wallet', async ({ safePage, scenario, owners }) => {
    await seedConnectedWallet(safePage, owners.owner4.privateKey)
    const home = new HomePage(safePage)

    await home.goto(scenario.safes.static.SEP_STATIC_SAFE_0)

    await home.waitForDashboardLoaded()
    await expect(new WalletPage(safePage).accountCenter).toBeVisible()
  })
})
