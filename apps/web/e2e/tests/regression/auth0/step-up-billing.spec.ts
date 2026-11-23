// The billing actions that need a step-up; the local billing service opens a local page in place of Stripe's checkout.
import type { Page } from '@playwright/test'
import { test, expect } from '../../../src/fixtures/test.fixture'
import { TEST_ADDRESSES, safeAddress } from '../../../src/data/constants'
import {
  addWorkspaceSafes,
  createEmailSession,
  createWorkspace,
  planName,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceResource,
  workspaceUrl,
  type EmailSession,
} from '../../../src/fixtures/email-session'
import { completeStepUp, expectActionCompleted } from '../../../src/fixtures/step-up'
import { WorkspacePage } from '../../../src/pages/workspace.page'

const WORKSPACE_NAME = 'Step-up billing'
const STARTER_SEATS = 2

// The plan card at the top of the Plans page names the plan in force.
const currentPlan = (page: Page) => page.getByRole('main').getByRole('heading', { level: 4 }).first()

/** The Plans page confirms a switch made during the free access, which the local billing service always gives. */
async function expectPlanSwitched(page: Page, plan: string): Promise<void> {
  await expect(page.getByRole('dialog', { name: new RegExp(`^You're on ${plan}`) })).toBeVisible()
  await page.getByRole('button', { name: 'Get started' }).click()
  await expect(currentPlan(page)).toHaveText(plan)
}

/** The local checkout page, opened for the Workspace (as the billing service names it, without dashes). */
async function expectLocalCheckout(page: Page, workspaceId: string, plan: string): Promise<void> {
  await expect(page).toHaveURL(/\/billing\/checkout\/cs_e2e_\d+$/)
  await expect(page.getByRole('heading', { name: 'Local checkout' })).toBeVisible()
  await expect(page.getByText(`Plan: ${plan}`)).toBeVisible()
  await expect(page.getByText(`Workspace: ${workspaceId.replaceAll('-', '')}`)).toBeVisible()
}

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
    const createdSetup = safePage.waitForResponse(
      (response) => response.request().method() === 'POST' && response.url().endsWith('/v1/spaces/setup'),
    )
    await safePage.goto('/welcome/create-space')
    await workspace.startTrialViaWizard(WORKSPACE_NAME, STARTER_SEATS)
    const { spaceId: workspaceId } = (await (await createdSetup).json()) as { spaceId: string }
    await expectLocalCheckout(safePage, workspaceId, 'Starter')
    await workspace.checkoutBackLink.click()

    await workspace.finishSurveyButton.click()
    await completeStepUp(safePage)

    await expectLocalCheckout(safePage, workspaceId, 'Starter')
    await expect(safePage.getByText('30 days free')).toBeVisible()
  })

  test.describe('in an existing Workspace', () => {
    let setup: EmailSession
    let workspaceId: string

    test.beforeEach(async () => {
      setup = await createEmailSession(email)
      workspaceId = (await createWorkspace(setup, WORKSPACE_NAME)).uuid
    })

    const plansUrl = () => workspaceUrl('/spaces/plans', workspaceId)

    test('should open the checkout of a lapsed Workspace when the step-up succeeds', async ({ safePage }) => {
      await storeSubscription(setup, workspaceId, { status: 'canceled' })
      await safePage.goto(`/spaces/safe-accounts?spaceId=${workspaceId}`)

      await safePage.getByRole('tab', { name: '20 Safe accounts' }).click()
      await safePage.getByRole('button', { name: 'Continue with Business' }).click()
      await completeStepUp(safePage)

      await expectLocalCheckout(safePage, workspaceId, 'Business')
      await expect(safePage.getByText('days free')).toBeHidden()
    })

    test('should downgrade the plan when the step-up succeeds', async ({ safePage }) => {
      await storeSubscription(setup, workspaceId)
      await safePage.goto(`/spaces/plans?spaceId=${workspaceId}`)

      await safePage.getByRole('button', { name: 'Switch to Starter' }).click()
      await safePage.getByRole('button', { name: 'Confirm change' }).click()
      await completeStepUp(safePage)

      await expectActionCompleted(safePage, plansUrl())
      await expectPlanSwitched(safePage, 'Starter')
      await expect.poll(() => planName(user, workspaceId)).toBe('Starter')
    })

    test('should upgrade the plan when the step-up succeeds', async ({ safePage }) => {
      await storeSubscription(setup, workspaceId, { plan: 'starter' })
      await safePage.goto(`/spaces/plans?spaceId=${workspaceId}`)

      await safePage.getByRole('button', { name: 'Switch to Business' }).click()
      await safePage.getByRole('button', { name: 'Confirm change' }).click()
      await completeStepUp(safePage)

      await expectActionCompleted(safePage, plansUrl())
      await expectPlanSwitched(safePage, 'Business')
      await expect.poll(() => planName(user, workspaceId)).toBe('Business')
    })

    test('should remove the deselected Safe and downgrade when the step-up succeeds', async ({ safePage, safes }) => {
      await storeSubscription(setup, workspaceId)
      await addWorkspaceSafes(setup, workspaceId, [
        safeAddress(safes.basic),
        TEST_ADDRESSES.PLACEHOLDER_A,
        TEST_ADDRESSES.PLACEHOLDER_B,
      ])
      await safePage.goto(`/spaces/plans?spaceId=${workspaceId}`)

      await safePage.getByRole('button', { name: 'Switch to Starter' }).click()
      const selection = safePage.getByRole('dialog', { name: 'Select Safe accounts for your Safe Pro plan' })
      await selection.getByRole('checkbox', { name: /^Select 0xb000/ }).uncheck()
      await selection.getByRole('button', { name: 'Continue to downgrade' }).click()
      await safePage.getByRole('button', { name: 'Confirm change' }).click()
      await completeStepUp(safePage)

      await expectActionCompleted(safePage, plansUrl())
      await expectPlanSwitched(safePage, 'Starter')
      await expect.poll(() => planName(user, workspaceId)).toBe('Starter')
      const workspaceSafes = await workspaceResource(user, workspaceId, 'safes')
      expect(workspaceSafes.toLowerCase()).not.toContain(TEST_ADDRESSES.PLACEHOLDER_B)
      expect(workspaceSafes.toLowerCase()).toContain(TEST_ADDRESSES.PLACEHOLDER_A)
    })
  })
})
