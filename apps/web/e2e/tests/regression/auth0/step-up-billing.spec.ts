// The billing actions that need a step-up; the local billing service opens a local page in place of Stripe's checkout.
import type { Page } from '@playwright/test'
import { test, expect } from '../../../src/fixtures/test.fixture'
import { TEST_ADDRESSES, safeAddress } from '../../../src/data/constants'
import {
  addWorkspaceSafes,
  createEmailSession,
  createWorkspace,
  planName,
  removeSubscription,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceResource,
  workspaceUrl,
  type EmailSession,
} from '../../../src/fixtures/email-session'
import { completeStepUp, expectActionReplayed } from '../../../src/fixtures/step-up'

const WORKSPACE_NAME = 'Step-up billing'

// The plan card at the top of the Plans page names the plan in force.
const currentPlan = (page: Page) => page.getByRole('main').getByRole('heading', { level: 4 }).first()

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

  test('should open the checkout of the chosen trial when the step-up in the creation wizard succeeds', async ({
    safePage,
  }) => {
    let workspaceId = ''
    // A new Workspace has no plan in production; the local billing service would give it a trial on the first read.
    await safePage.route('**/v1/spaces', async (route) => {
      if (route.request().method() !== 'POST') return route.fallback()
      const response = await route.fetch()
      workspaceId = String(((await response.json()) as { uuid: string }).uuid)
      await removeSubscription(workspaceId)
      await route.fulfill({ response })
    })
    await safePage.goto('/welcome/create-space')
    await safePage.getByRole('textbox', { name: 'Workspace name' }).fill(WORKSPACE_NAME)
    await safePage.getByRole('button', { name: 'Next' }).click()

    const offer = safePage.getByRole('dialog', { name: 'Workspaces run on Safe Pro' })
    await offer.getByRole('radio', { name: /^Starter/ }).click()
    await offer.getByRole('button', { name: 'Claim free access' }).click()
    const returned = safePage.waitForURL(new RegExp(`/welcome/select-safes\\?spaceId=${workspaceId}`))
    await completeStepUp(safePage)

    // The step-up returns to the next step of the wizard, whose replay then opens the checkout.
    await returned
    await expectLocalCheckout(safePage, workspaceId, 'Starter')
    await expect(safePage.getByText('30 days free')).toBeVisible()
    await expect(safePage.getByText(`/welcome/select-safes?spaceId=${workspaceId}`)).toBeVisible()
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

      await safePage.getByRole('button', { name: 'Continue with Business' }).click()
      const returned = safePage.waitForURL(new RegExp(`/spaces/safe-accounts\\?spaceId=${workspaceId}`))
      await completeStepUp(safePage)

      await returned
      await expectLocalCheckout(safePage, workspaceId, 'Business')
      await expect(safePage.getByText('days free')).toBeHidden()
    })

    test('should downgrade the plan when the step-up succeeds', async ({ safePage }) => {
      await storeSubscription(setup, workspaceId)
      await safePage.goto(`/spaces/plans?spaceId=${workspaceId}`)

      await safePage.getByRole('button', { name: 'Switch to Starter' }).click()
      await safePage.getByRole('button', { name: 'Confirm change' }).click()
      await completeStepUp(safePage)

      await expectActionReplayed(safePage, plansUrl(), 'Plan updated')
      await expect(currentPlan(safePage)).toHaveText('Starter')
      await expect.poll(() => planName(user, workspaceId)).toBe('Starter')
    })

    test('should upgrade the plan when the step-up succeeds', async ({ safePage }) => {
      await storeSubscription(setup, workspaceId, { plan: 'starter' })
      await safePage.goto(`/spaces/plans?spaceId=${workspaceId}`)

      await safePage.getByRole('button', { name: 'Upgrade to Business' }).click()
      await safePage.getByRole('button', { name: 'Confirm change' }).click()
      await completeStepUp(safePage)

      await expectActionReplayed(safePage, plansUrl(), 'Plan updated')
      await expect(currentPlan(safePage)).toHaveText('Business')
      await expect.poll(() => planName(user, workspaceId)).toBe('Business')
    })

    test('should remove the deselected Safe and downgrade when the step-up succeeds', async ({ safePage, safes }) => {
      await storeSubscription(setup, workspaceId)
      await addWorkspaceSafes(setup, workspaceId, [
        safeAddress(safes.SEP_STATIC_SAFE_1),
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

      await expectActionReplayed(safePage, plansUrl(), 'Plan updated')
      await expect(currentPlan(safePage)).toHaveText('Starter')
      await expect.poll(() => planName(user, workspaceId)).toBe('Starter')
      const workspaceSafes = await workspaceResource(user, workspaceId, 'safes')
      expect(workspaceSafes.toLowerCase()).not.toContain(TEST_ADDRESSES.PLACEHOLDER_B)
      expect(workspaceSafes.toLowerCase()).toContain(TEST_ADDRESSES.PLACEHOLDER_A)
    })
  })
})
