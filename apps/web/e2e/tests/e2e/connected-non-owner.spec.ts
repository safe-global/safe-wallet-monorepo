import { isIsolated } from '../../src/fixtures/isolated-data'
import { test, expect } from '../../src/fixtures/journey.fixture'
import { seedSafe } from '../../src/seed/safe'
import { waitForNativeBalance } from '../../src/seed/tokens'
import { AssetsPage } from '../../src/pages/assets.page'
import { WalletPage } from '../../src/pages/wallet.page'

const NOT_A_SIGNER = 'Your connected wallet is not a signer of this Safe account'

test.describe('Connected wallet that is not a signer', { tag: '@e2e' }, () => {
  test.skip(!isIsolated, 'Seeds its own Safe on the isolated stack')

  test('should disable Send and say why when the connected wallet is not a signer of the Safe', async ({
    safePage,
    journey,
  }, testInfo) => {
    const safe = await seedSafe(journey, { threshold: 1 })
    await waitForNativeBalance(safe)
    testInfo.annotations.push({ type: 'safe-address', description: safe.prefixedAddress })

    const wallet = new WalletPage(safePage)
    const assets = new AssetsPage(safePage)
    await assets.goto(safe.prefixedAddress)
    await expect(assets.firstTokenSendButton).toBeEnabled()

    await wallet.disconnect()
    await wallet.connectWallet(journey.owners.owner3.privateKey)
    await assets.firstTokenWalletCheck.hover()

    await expect(assets.firstTokenSendButton).toBeDisabled()
    await expect(safePage.getByText(NOT_A_SIGNER)).toBeVisible()
  })
})
