import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { ROUTES } from '../../src/data/constants'
import { LoadSafePage } from '../../src/pages/load-safe.page'
import { OwnersPage } from '../../src/pages/owners.page'

const SAFE_NAME = 'Loaded treasury'
const SIGNER_NAME = 'Loaded signer'

test.describe('Load a Safe', { tag: '@e2e' }, () => {
  test('should add the Safe with its name and a signer name when a user loads an existing Safe', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 2, inAccounts: false })

    const load = new LoadSafePage(safePage)
    await load.goto()
    await load.enterSafe({ name: SAFE_NAME, address: safe.address })
    await expect(load.signerNames).toHaveCount(2)
    await load.signerNames.first().fill(SIGNER_NAME)
    await load.nextButton.click()

    await expect(safePage.getByText(SAFE_NAME)).toBeVisible()
    await expect(safePage.getByText(SIGNER_NAME)).toBeVisible()
    await expect(safePage.getByText('2 out of 2 signers')).toBeVisible()
    await load.addButton.click()

    await expect(safePage).toHaveURL((url) => url.pathname === ROUTES.home)
    expect(new URL(safePage.url()).searchParams.get('safe')).toBe(safe.prefixedAddress)
    await expect(load.sidebarSafeName).toHaveText(SAFE_NAME)

    const owners = new OwnersPage(safePage)
    await owners.goto(safe.prefixedAddress)
    await expect(owners.signerList).toContainText(SIGNER_NAME)
  })
})
