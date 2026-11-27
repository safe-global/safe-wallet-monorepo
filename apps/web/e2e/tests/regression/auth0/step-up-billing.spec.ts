// The billing step-up that spans a redirect to the checkout and back; the billing flows are in e2e/billing.spec.ts.
import { test, expect } from '../../../src/fixtures/test.fixture'
import { expectLocalCheckout } from '../../../src/fixtures/billing'
import { signInWithEmail, uniqueEmail, workspaceIdNamed } from '../../../src/fixtures/email-session'
import { completeStepUp } from '../../../src/fixtures/step-up'
import { WorkspacePage } from '../../../src/pages/workspace.page'

const WORKSPACE_NAME = 'Step-up billing'
const STARTER_SEATS = 2

test.describe('Step-up for the billing actions of a Workspace', { tag: '@regression' }, () => {
  test('should reopen the checkout of the same Workspace when the user comes back from it and the step-up succeeds', async ({
    safePage,
  }) => {
    const user = await signInWithEmail(safePage, uniqueEmail('step-up-billing'), { secondFactor: false })
    const workspace = new WorkspacePage(safePage)
    await safePage.goto('/welcome/create-space')
    await workspace.startTrialViaWizard(WORKSPACE_NAME, STARTER_SEATS)
    const workspaceId = await workspaceIdNamed(user, WORKSPACE_NAME)
    await expectLocalCheckout(safePage, workspaceId, 'Starter')
    await workspace.checkoutBackLink.click()

    await workspace.finishSurveyButton.click()
    await completeStepUp(safePage)

    await expectLocalCheckout(safePage, workspaceId, 'Starter')
    await expect(safePage.getByText('14 days free')).toBeVisible()
  })
})
