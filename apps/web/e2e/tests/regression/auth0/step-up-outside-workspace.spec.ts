// These flows start outside a Workspace and return the step-up to their own page, not the page the user left.
import type { Page } from '@playwright/test'
import { test, expect } from '../../../src/fixtures/test.fixture'
import { safeAddress } from '../../../src/data/constants'
import {
  createWorkspace,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceResource,
  workspaceUrl,
  type EmailSession,
} from '../../../src/fixtures/email-session'
import { completeStepUp, expectActionReplayed } from '../../../src/fixtures/step-up'

const WORKSPACE_NAME = 'Step-up outside'

const urlSpaceId = (page: Page): string => {
  const spaceId = new URL(page.url()).searchParams.get('spaceId')
  if (!spaceId) throw new Error(`${page.url()} names no Workspace`)
  return spaceId
}

/** Names the Workspace in the first step of the creation wizard; the gateway creates it without a step-up. */
async function nameNewWorkspace(page: Page): Promise<void> {
  await page.getByRole('textbox', { name: 'Workspace name' }).fill(WORKSPACE_NAME)
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByRole('heading', { name: 'Select Safe accounts' })).toBeVisible()
}

test.describe('Step-up for the Workspace actions outside a Workspace', { tag: '@regression' }, () => {
  let user: EmailSession

  /** Creating a Workspace needs no step-up, so the user's own session prepares it, with a plan. */
  async function prepareWorkspace(): Promise<string> {
    const workspaceId = (await createWorkspace(user, WORKSPACE_NAME)).uuid
    await storeSubscription(user, workspaceId)
    return workspaceId
  }

  test.beforeEach(async ({ safePage }) => {
    user = await signInWithEmail(safePage, uniqueEmail('step-up-outside'), { secondFactor: false })
  })

  test('should add the Safe to the chosen Workspace when the step-up from its Safe page succeeds', async ({
    safePage,
    safes,
  }) => {
    const workspaceId = await prepareWorkspace()
    await safePage.goto(`/home?safe=${safes.SEP_STATIC_SAFE_1}`)

    await safePage.getByRole('button', { name: 'Add Safe to Workspace' }).click()
    await safePage.getByRole('menuitem', { name: WORKSPACE_NAME }).click()
    await completeStepUp(safePage)

    // The Safe opens inside the Workspace it now belongs to.
    const safeParam = safes.SEP_STATIC_SAFE_1.replace(':', '(:|%3A)')
    const safePageUrl = new RegExp(`/home\\?safe=${safeParam}&spaceId=${workspaceId}$`)
    await expectActionReplayed(safePage, safePageUrl, 'Safe account added')
    await expect(safePage.getByRole('button', { name: 'Add Safe to Workspace' })).toBeHidden()
    expect(await workspaceResource(user, workspaceId, 'safes')).toContain(safeAddress(safes.SEP_STATIC_SAFE_1))
  })

  test('should add the Safe and open the invite step when the step-up of a wizard from a Safe page succeeds', async ({
    safePage,
    safes,
  }) => {
    await safePage.goto(`/home?safe=${safes.SEP_STATIC_SAFE_1}`)
    await safePage.getByRole('button', { name: 'Add Safe to Workspace' }).click()
    // Without a Workspace, the user is offered to create one.
    await safePage.getByRole('button', { name: 'Create a Workspace' }).click()
    await nameNewWorkspace(safePage)
    const workspaceId = urlSpaceId(safePage)

    await safePage.getByRole('button', { name: 'Next' }).click()
    await safePage.getByRole('textbox', { name: 'Add a name' }).fill('Treasury Safe')
    await safePage.getByRole('button', { name: 'Add accounts' }).click()
    await completeStepUp(safePage)

    // The replay moves the user on to the next step of the wizard.
    await expectActionReplayed(safePage, /\/welcome\/invite-members\?/, 'Safe account added')
    expect(urlSpaceId(safePage)).toBe(workspaceId)
    expect(await workspaceResource(user, workspaceId, 'safes')).toContain(safeAddress(safes.SEP_STATIC_SAFE_1))
  })

  test('should add a new pay-later Safe to the Workspace when the step-up after its creation succeeds', async ({
    safePage,
    walletPage,
    credentials,
  }) => {
    const workspaceId = await prepareWorkspace()
    await safePage.goto(`/spaces/safe-accounts?spaceId=${workspaceId}`)

    await safePage.getByRole('button', { name: 'Add accounts' }).click()
    await safePage.getByRole('button', { name: 'Create new Safe' }).click()
    await walletPage.connectWallet(credentials.OWNER_4_PRIVATE_KEY)
    await safePage.getByRole('button', { name: 'Next' }).click()
    await safePage.getByRole('button', { name: 'Next' }).click()
    await expect(safePage.getByRole('radio', { name: 'Pay later' })).toBeChecked()
    await safePage.getByRole('button', { name: 'Create account' }).click()
    await completeStepUp(safePage)

    // The step-up returns to the new Safe, not to the creation form; the router later decodes the `:`.
    await expectActionReplayed(
      safePage,
      new RegExp(`/home\\?safe=sep(:|%3A)0x\\w{40}&spaceId=${workspaceId}$`),
      'Safe account added',
    )
    const newSafe = new URL(safePage.url()).searchParams.get('safe') ?? ''
    expect(await workspaceResource(user, workspaceId, 'safes')).toContain(safeAddress(newSafe))
  })

  test('should invite the member and open the last wizard step when the step-up succeeds', async ({ safePage }) => {
    const invitee = uniqueEmail('invitee')
    await safePage.goto('/welcome/create-space')
    await nameNewWorkspace(safePage)
    const workspaceId = urlSpaceId(safePage)
    await safePage.getByRole('button', { name: 'Skip, add Safe accounts later' }).click()

    await expect(safePage.getByRole('heading', { name: 'Invite your team' })).toBeVisible()
    await safePage.getByPlaceholder('Email, wallet address or ENS name').fill(invitee)
    await safePage.getByRole('button', { name: 'Next' }).click()
    await completeStepUp(safePage)

    // The replay moves the user on to the last step of the wizard.
    await expectActionReplayed(safePage, workspaceUrl('/welcome/survey', workspaceId), 'Invitation sent')
    expect(await workspaceResource(user, workspaceId, 'members')).toContain(invitee)
  })
})
