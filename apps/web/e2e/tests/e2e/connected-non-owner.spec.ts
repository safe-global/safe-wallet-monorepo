import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { waitForNativeBalance } from '../../src/seed/tokens'
import { AssetsPage } from '../../src/pages/assets.page'

const NOT_A_SIGNER = 'Your connected wallet is not a signer of this Safe account'

test.describe('Connected wallet that is not a signer', { tag: '@e2e' }, () => {
  test('should disable Send and say why when the connected wallet is not a signer of the Safe', async ({
    safePage,
    journey,
  }) => {
    const safe = await seedSafe(journey, { owners: ['owner4', 'owner1'], threshold: 1 })
    await waitForNativeBalance(safe)

    const assets = new AssetsPage(safePage)
    await assets.goto(safe.prefixedAddress)
    await expect(assets.firstTokenSendButton).toBeEnabled()

    await journey.connectAs('owner3')
    await assets.firstTokenWalletCheck.hover()

    await expect(assets.firstTokenSendButton).toBeDisabled()
    await expect(safePage.getByText(NOT_A_SIGNER)).toBeVisible()
  })
})
