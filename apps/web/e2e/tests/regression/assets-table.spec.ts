import { test, expect } from '../../src/fixtures/test.fixture'
import { seedConnectedWallet } from '../../src/fixtures/seed-wallet'
import { AssetsPage } from '../../src/pages/assets.page'

test.describe('Assets table', { tag: ['@regression', '@migration'] }, () => {
  test('should show a hide checkbox on every token row when "Hide tokens" is picked from the manage-tokens menu', async ({
    safePage,
    safeApiClient,
    safes,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'safe-address', description: safes.SEP_ASSETS_SAFE })
    const balances = await safeApiClient.getBalances(safes.SEP_ASSETS_SAFE.split(':')[1])
    expect(balances.items.length).toBeGreaterThan(1)

    const assets = new AssetsPage(safePage)
    await assets.goto(safes.SEP_ASSETS_SAFE)
    await expect(assets.tokenRows.first()).toBeVisible()

    // Small balances are hidden by default and every test token here is worth $0, so unhide them to
    // exercise more than the native-token row.
    await assets.setHideSmallBalances(false)
    await expect(assets.tokenRows).toHaveCount(balances.items.length)

    await assets.enterHideTokensMode()
    await expect(assets.manageTokensMenu).toBeHidden()

    await expect(assets.selectedTokensCount).toHaveText('0 tokens selected')
    await expect(assets.saveHiddenTokensButton).toBeVisible()
    await expect(assets.cancelHiddenTokensButton).toBeVisible()
    await expect(assets.deselectAllButton).toBeVisible()

    const rowCount = await assets.tokenRows.count()
    for (let i = 0; i < rowCount; i++) {
      await expect(assets.hideCheckbox(assets.tokenRows.nth(i))).toBeVisible()
    }
  })

  test('should open the send-tokens form with the row token preselected when an owner clicks Send', async ({
    safePage,
    walletPage,
    credentials,
    safes,
  }, testInfo) => {
    testInfo.annotations.push({ type: 'safe-address', description: safes.SEP_ASSETS_SAFE })
    await seedConnectedWallet(safePage, credentials.OWNER_4_PRIVATE_KEY)

    const assets = new AssetsPage(safePage)
    await assets.goto(safes.SEP_ASSETS_SAFE)
    // The seeded wallet reconnects asynchronously after load; a rate-limited RPC can push it past 10s.
    await expect(walletPage.accountCenter).toBeVisible({ timeout: 30_000 })

    const row = assets.tokenRows.first()
    await expect(row).toBeVisible()
    const symbol = await assets.tokenSymbol(row).innerText()

    const sendButton = assets.sendButton(row)
    await expect(sendButton).toBeEnabled()
    await sendButton.click()

    await expect(safePage.getByTestId('modal-title')).toHaveText('New transaction')
    await expect(safePage.getByRole('heading', { name: 'Send tokens' })).toBeVisible()
    await expect(safePage.getByTestId('token-selector')).toContainText(symbol)
  })
})
