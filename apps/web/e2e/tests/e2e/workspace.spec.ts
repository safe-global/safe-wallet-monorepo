import { test, expect } from '../../src/fixtures/journey.fixture'
import { HomePage } from '../../src/pages/home.page'
import { WalletPage } from '../../src/pages/wallet.page'
import { WorkspacePage } from '../../src/pages/workspace.page'
import { seedQueuedTransfer, seedSafe } from '../../src/seed/safe'
import { seedBusinessWorkspace } from '../../src/seed/workspace'

const FIAT_TOTAL = /^\$[ \s]*[\d,]+\.\d{2}$/

const searchParam = (name: string) => (url: URL) => url.searchParams.get(name)

test.describe('Workspace', { tag: '@e2e' }, () => {
  test('should create a Workspace through the wizard when the owner signs in with the wallet', async ({
    safePage,
    journey,
  }, testInfo) => {
    const name = `Workspace ${testInfo.testId.slice(0, 8)}`
    const workspace = new WorkspacePage(safePage)

    await journey.connectAs('owner4')
    await safePage.goto('/welcome/spaces')
    await new WalletPage(safePage).signInWithEthereum()
    await workspace.createViaWizard(name)

    await expect(safePage).toHaveURL((url) => url.pathname === '/spaces' && !!searchParam('spaceId')(url))
    await workspace.selectorButton.click()
    await expect(workspace.selectorMenu).toContainText(name)
  })

  test('should show the Workspace Safes and their pending transaction on the dashboard and open a Safe from it', async ({
    safePage,
    journey,
  }) => {
    const treasury = await seedSafe(journey, { owners: ['owner1', 'owner4'], threshold: 2 })
    const payroll = await seedSafe(journey, { owners: ['owner4'], threshold: 1 })
    await seedQueuedTransfer(treasury, { nonce: 0, recipient: payroll.address, amount: '0.001' })
    const { id: workspaceId } = await seedBusinessWorkspace(safePage, { Treasury: treasury, Payroll: payroll })

    const workspace = new WorkspacePage(safePage)
    await workspace.gotoDashboard(workspaceId)

    await expect(workspace.totalValue).toHaveText(FIAT_TOTAL)
    await expect(workspace.accountRows).toHaveCount(2)
    await expect(workspace.pendingItems).toHaveCount(1)

    await workspace.accountRow('Treasury').getByTestId('account-row-link').click()
    await expect(safePage).toHaveURL((url) => searchParam('safe')(url) === treasury.prefixedAddress)
    const safeHeader = new HomePage(safePage).safeHeaderInfo
    await expect(safeHeader).toContainText('Treasury')
    await expect(safeHeader).toContainText('2/2')

    await workspace.gotoDashboard(workspaceId)
    await workspace.viewAllAccountsButton.click()
    await expect(safePage).toHaveURL(
      (url) => url.pathname === '/spaces/safe-accounts' && searchParam('spaceId')(url) === workspaceId,
    )
    await expect(safePage.getByTestId('account-table-row')).toHaveCount(2)
  })
})
