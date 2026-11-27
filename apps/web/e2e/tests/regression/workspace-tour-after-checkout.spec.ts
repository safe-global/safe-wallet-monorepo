// The free access confirmation and the workspace tour both become due on the return from checkout; one shows at a time.
import { test, expect } from '../../src/fixtures/test.fixture'
import { expectLocalCheckout } from '../../src/fixtures/billing'
import { clearSubscription, createWorkspace, signInWithEmail, uniqueEmail } from '../../src/fixtures/email-session'
import { WorkspacePage } from '../../src/pages/workspace.page'

test.describe('Workspace tour after a checkout', { tag: '@regression' }, () => {
  test.use({ showWorkspaceTour: true })

  test('should start the tour only after the admin closes the free access confirmation', async ({
    safePage,
  }, testInfo) => {
    const tourWelcome = safePage.getByTestId('workspace-tour-welcome')
    const user = await signInWithEmail(safePage, uniqueEmail('tour-after-checkout'))
    const workspaceId = (await createWorkspace(user, `Tour ${testInfo.testId.slice(0, 8)}`)).uuid
    await clearSubscription(user, workspaceId)
    const workspace = new WorkspacePage(safePage)

    await workspace.gotoDashboard(workspaceId)
    await workspace.claimTrialButton.click()
    await expectLocalCheckout(safePage, workspaceId, 'Starter')
    await workspace.completeCheckoutButton.click()

    await expect(workspace.trialActivatedDialog).toBeVisible()
    // The lock lifts in the same render that makes the tour due
    await expect(workspace.claimTrialModal).toBeHidden()
    await expect(tourWelcome).toBeHidden()

    await workspace.trialActivatedDialog.getByRole('button', { name: 'Get started' }).click()

    await expect(tourWelcome).toBeVisible()
    await expect(workspace.trialActivatedDialog).toBeHidden()
  })
})
