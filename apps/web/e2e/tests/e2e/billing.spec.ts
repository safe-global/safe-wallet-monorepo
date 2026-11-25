// The local billing service opens a local page in place of Stripe's checkout; its button completes the checkout.
import { test, expect } from '../../src/fixtures/test.fixture'
import { expectLocalCheckout } from '../../src/fixtures/billing'
import {
  acceptInvite,
  clearSubscription,
  createEmailSession,
  createWorkspace,
  inviteMember,
  planName,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  type EmailSession,
} from '../../src/fixtures/email-session'
import { WorkspacePage } from '../../src/pages/workspace.page'

const BUSINESS_SEATS = 20

test.describe('Safe Pro billing of a Workspace', { tag: '@e2e' }, () => {
  let user: EmailSession
  let workspaceId: string
  let workspace: WorkspacePage

  test.beforeEach(async ({ safePage }, testInfo) => {
    user = await signInWithEmail(safePage, uniqueEmail('billing'))
    workspaceId = (await createWorkspace(user, `Billing ${testInfo.testId.slice(0, 8)}`)).uuid
    workspace = new WorkspacePage(safePage)
  })

  test('should unlock a Workspace without a plan when the admin claims its free access', async ({ safePage }) => {
    await clearSubscription(user, workspaceId)
    await workspace.gotoDashboard(workspaceId)

    await expect(workspace.claimTrialModal).toContainText('Free for 14 days')
    await workspace.claimTrialButton.click()
    await expectLocalCheckout(safePage, workspaceId, 'Starter')
    await expect(safePage.getByText('14 days free')).toBeVisible()
    await workspace.completeCheckoutButton.click()

    await expect(workspace.trialActivatedDialog).toBeVisible()
    await workspace.trialActivatedDialog.getByRole('button', { name: 'Get started' }).click()
    await expect(workspace.claimTrialModal).toBeHidden()
    await expect.poll(() => planName(user, workspaceId)).toBe('Starter')
  })

  test('should tell a member that only an admin can claim the free access of a Workspace without a plan', async ({
    safePage,
  }) => {
    await clearSubscription(user, workspaceId)
    const memberEmail = uniqueEmail('billing-member')
    await inviteMember(user, workspaceId, { email: memberEmail, name: 'Member' })
    await acceptInvite(await createEmailSession(memberEmail), workspaceId, 'Member')

    await signInWithEmail(safePage, memberEmail)
    await workspace.gotoDashboard(workspaceId)

    await expect(workspace.memberClaimNotice).toContainText('is locked until an admin claims free access')
    await expect(workspace.claimTrialModal).toBeHidden()
  })

  test('should unlock a lapsed Workspace when the admin buys a paid plan, with no new free access', async ({
    safePage,
  }) => {
    await storeSubscription(user, workspaceId, { status: 'canceled' })
    await workspace.gotoDashboard(workspaceId)

    await workspace.planSizeTab(BUSINESS_SEATS).click()
    await workspace.choosePlanButton('Business').click()
    await expectLocalCheckout(safePage, workspaceId, 'Business')
    await expect(safePage.getByText('days free')).toBeHidden()
    await workspace.completeCheckoutButton.click()

    await expect(workspace.subscriptionActivatedDialog).toContainText('Business')
    await workspace.subscriptionActivatedDialog.getByRole('button', { name: 'Get started' }).click()
    await expect(workspace.planChooserModal).toBeHidden()
    await expect.poll(() => planName(user, workspaceId)).toBe('Business')
  })

  test('should move the Workspace to Business when the admin upgrades from Starter', async () => {
    await storeSubscription(user, workspaceId, { plan: 'starter' })
    await workspace.gotoPlans(workspaceId)

    await workspace.switchPlanButton('Business').click()
    await workspace.confirmPlanChangeButton.click()

    await workspace.planSwitchedDialog('Business').getByRole('button', { name: 'Get started' }).click()
    await expect(workspace.currentPlanName).toHaveText('Business')
    await expect.poll(() => planName(user, workspaceId)).toBe('Business')
  })

  test('should move the Workspace to Starter when the admin downgrades from Business', async () => {
    await storeSubscription(user, workspaceId)
    await workspace.gotoPlans(workspaceId)

    await workspace.switchPlanButton('Starter').click()
    await workspace.confirmPlanChangeButton.click()

    await workspace.planSwitchedDialog('Starter').getByRole('button', { name: 'Get started' }).click()
    await expect(workspace.currentPlanName).toHaveText('Starter')
    await expect.poll(() => planName(user, workspaceId)).toBe('Starter')
  })
})
