// Billing actions whose step-up spans a checkout redirect or several requests; the flows are in e2e/billing.spec.ts.
import { test, expect } from '../../../src/fixtures/test.fixture'
import { TEST_ADDRESSES, safeAddress } from '../../../src/data/constants'
import { expectLocalCheckout } from '../../../src/fixtures/billing'
import {
  addWorkspaceSafes,
  createEmailSession,
  createWorkspace,
  planName,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceIdNamed,
  workspaceResource,
  workspaceUrl,
  type EmailSession,
} from '../../../src/fixtures/email-session'
import { completeStepUp, expectActionCompleted } from '../../../src/fixtures/step-up'
import { WorkspacePage } from '../../../src/pages/workspace.page'

const WORKSPACE_NAME = 'Step-up billing'
const STARTER_SEATS = 2

test.describe('Step-up for the billing actions of a Workspace', { tag: '@regression' }, () => {
  let user: EmailSession
  let email: string

  test.beforeEach(async ({ safePage }) => {
    email = uniqueEmail('step-up-billing')
    user = await signInWithEmail(safePage, email, { secondFactor: false })
  })

  test('should reopen the checkout of the same Workspace when the user comes back from it and the step-up succeeds', async ({
    safePage,
  }) => {
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

  test('should remove the deselected Safe and downgrade when the step-up succeeds', async ({ safePage, safes }) => {
    const setup = await createEmailSession(email)
    const workspaceId = (await createWorkspace(setup, WORKSPACE_NAME)).uuid
    await storeSubscription(setup, workspaceId)
    await addWorkspaceSafes(setup, workspaceId, [
      safeAddress(safes.basic),
      TEST_ADDRESSES.PLACEHOLDER_A,
      TEST_ADDRESSES.PLACEHOLDER_B,
    ])
    const workspace = new WorkspacePage(safePage)
    await workspace.gotoPlans(workspaceId)

    await workspace.switchPlanButton('Starter').click()
    const selection = safePage.getByRole('dialog', { name: 'Select Safe accounts for your Safe Pro plan' })
    await selection.getByRole('checkbox', { name: /^Select 0xb000/ }).uncheck()
    await selection.getByRole('button', { name: 'Continue to downgrade' }).click()
    await workspace.confirmPlanChangeButton.click()
    await completeStepUp(safePage)

    await expectActionCompleted(safePage, workspaceUrl('/spaces/plans', workspaceId))
    await workspace.planSwitchedDialog('Starter').getByRole('button', { name: 'Get started' }).click()
    await expect(workspace.currentPlanName).toHaveText('Starter')
    await expect.poll(() => planName(user, workspaceId)).toBe('Starter')
    const workspaceSafes = await workspaceResource(user, workspaceId, 'safes')
    expect(workspaceSafes.toLowerCase()).not.toContain(TEST_ADDRESSES.PLACEHOLDER_B)
    expect(workspaceSafes.toLowerCase()).toContain(TEST_ADDRESSES.PLACEHOLDER_A)
  })
})
