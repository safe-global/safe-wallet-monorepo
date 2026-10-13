/**
 * Step-up authentication for the sensitive Workspace actions that start outside a Workspace: from a Safe page and
 * from the Workspace creation wizard. These flows send the step-up back to their own page, not the page the user
 * left, so that the replay can move the user on.
 *
 * The user signs in by email without a second factor, so the gateway answers each action with `elevation_required`.
 */
import type { Browser, Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import {
  createWorkspace,
  openEmailSession,
  signInWithEmail,
  storeSubscription,
  uniqueEmail,
  workspaceResource,
} from '../../src/fixtures/email-session'
import { completeStepUp, expectActionReplayed } from '../../src/fixtures/step-up'

const WORKSPACE_NAME = 'Step-up outside'

const prefixless = (prefixedAddress: string): string => prefixedAddress.split(':')[1]

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
  test.skip(!isIsolated, 'Needs the local Auth0 of the isolated stack')

  let email: string

  /** Creates a Workspace with a plan through a second session of the user that needs no step-up. */
  async function prepareWorkspace(browser: Browser): Promise<string> {
    const setup = await openEmailSession(browser, email)
    const workspaceId = (await createWorkspace(setup, WORKSPACE_NAME)).uuid
    await storeSubscription(workspaceId)
    await setup.context().close()
    return workspaceId
  }

  test.beforeEach(async ({ safePage }) => {
    email = uniqueEmail('step-up-outside')
    await signInWithEmail(safePage, email, { secondFactor: false })
  })

  test('that the Safe is added to a Workspace from its Safe page after the code', async ({
    safePage,
    safes,
    browser,
  }) => {
    const workspaceId = await prepareWorkspace(browser)
    await safePage.goto(`/home?safe=${safes.SEP_STATIC_SAFE_1}`)

    await safePage.getByRole('button', { name: 'Add Safe to Workspace' }).click()
    await safePage.getByRole('menuitem', { name: WORKSPACE_NAME }).click()
    await completeStepUp(safePage)

    // The Safe opens inside the Workspace it now belongs to.
    const safeParam = safes.SEP_STATIC_SAFE_1.replace(':', '(:|%3A)')
    const safePageUrl = new RegExp(`/home\\?safe=${safeParam}&spaceId=${workspaceId}$`)
    await expectActionReplayed(safePage, safePageUrl, 'Safe account added')
    await expect(safePage.getByRole('button', { name: 'Add Safe to Workspace' })).toBeHidden()
    expect(await workspaceResource(safePage, workspaceId, 'safes')).toContain(prefixless(safes.SEP_STATIC_SAFE_1))
  })

  test('that a new Workspace from a Safe page receives the Safe after the code', async ({ safePage, safes }) => {
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
    expect(await workspaceResource(safePage, workspaceId, 'safes')).toContain(prefixless(safes.SEP_STATIC_SAFE_1))
  })

  test('that a new Safe created inside a Workspace with pay later joins it after the code', async ({
    safePage,
    browser,
    walletPage,
    credentials,
  }) => {
    const workspaceId = await prepareWorkspace(browser)
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
    expect(await workspaceResource(safePage, workspaceId, 'safes')).toContain(prefixless(newSafe))
  })

  test('that the invitation step of the creation wizard invites the member after the code', async ({ safePage }) => {
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
    await expectActionReplayed(safePage, new RegExp(`/welcome/survey\\?spaceId=${workspaceId}$`), 'Invitation sent')
    expect(await workspaceResource(safePage, workspaceId, 'members')).toContain(invitee)
  })
})
