/**
 * Step-up authentication for a sensitive Workspace action, end to end against the gateway and the local Auth0.
 *
 * The user signs in by email without a second factor, so the gateway answers the rename with
 * `elevation_required`. The wallet sends the user to Auth0 for a code and, on return, repeats the rename on the
 * page the user left. Without the step-up the name must not change.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../../src/fixtures/test.fixture'
import {
  createWorkspace,
  launchScreen,
  signInWithEmail,
  uniqueEmail,
  workspaceName,
  workspaceUrl,
  type EmailSession,
} from '../../../src/fixtures/email-session'
import { Auth0Page } from '../../../src/pages/auth0.page'
import { completeStepUp, expectActionReplayed, toast } from '../../../src/fixtures/step-up'

const ORIGINAL_NAME = 'Step-up Workspace'
const NEW_NAME = 'Renamed after step-up'
const SETTINGS_PATH = '/spaces/settings/general'

const nameInput = (page: Page) => page.getByTestId('space-name-input')

async function rename(page: Page, name: string): Promise<void> {
  await nameInput(page).fill(name)
  await page.getByTestId('space-save-button').click()
}

test.describe('Step-up for a Workspace rename', { tag: '@regression' }, () => {
  let session: EmailSession
  let workspaceId: string
  let settingsUrl: RegExp

  test.beforeEach(async ({ safePage }) => {
    session = await signInWithEmail(safePage, uniqueEmail('step-up'), { secondFactor: false })
    workspaceId = (await createWorkspace(session, ORIGINAL_NAME)).uuid
    settingsUrl = workspaceUrl(SETTINGS_PATH, workspaceId)
    await safePage.goto(`${SETTINGS_PATH}?spaceId=${workspaceId}`)
    await expect(nameInput(safePage)).toHaveValue(ORIGINAL_NAME)
  })

  test('that the rename completes on the same page after the user enters the code', async ({ safePage }) => {
    await rename(safePage, NEW_NAME)
    await completeStepUp(safePage)

    await expectActionReplayed(safePage, settingsUrl, 'Workspace updated')
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)
    await expect.poll(() => workspaceName(session, workspaceId)).toBe(NEW_NAME)
  })

  test('that cancelling returns the user to the page without an error and without the rename', async ({ safePage }) => {
    const auth0 = new Auth0Page(safePage)

    await rename(safePage, NEW_NAME)
    await auth0.cancelButton.click()

    await expect(safePage).toHaveURL(settingsUrl)
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(nameInput(safePage)).toHaveValue(ORIGINAL_NAME)
    await expect(toast(safePage, 'Verification was not completed')).toBeHidden()
    expect(await workspaceName(session, workspaceId)).toBe(ORIGINAL_NAME)
  })

  test('that the rename fails when Auth0 does not report the second factor', async ({ safePage }) => {
    const auth0 = new Auth0Page(safePage)

    await rename(safePage, NEW_NAME)
    await auth0.verify({ reportSecondFactor: false })

    await expect(safePage).toHaveURL(settingsUrl)
    await expect(toast(safePage, 'Verification was not completed')).toBeVisible()
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(nameInput(safePage)).toHaveValue(ORIGINAL_NAME)
    expect(await workspaceName(session, workspaceId)).toBe(ORIGINAL_NAME)
  })

  test('that a second sensitive action right after a step-up needs no new code', async ({ safePage }) => {
    await rename(safePage, NEW_NAME)
    await completeStepUp(safePage)
    await expectActionReplayed(safePage, settingsUrl, 'Workspace updated')
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)

    await rename(safePage, 'Renamed again')

    await expect(toast(safePage, 'Workspace name updated')).toBeVisible()
    await expect(safePage).toHaveURL(settingsUrl)
    await expect.poll(() => workspaceName(session, workspaceId)).toBe('Renamed again')
  })
})

test.describe('Workspace rename after a sign-in with a second factor', { tag: '@regression' }, () => {
  test('that the rename needs no step-up while the sign-in second factor is recent', async ({ safePage }) => {
    const session = await signInWithEmail(safePage, uniqueEmail('fresh-mfa'))
    const { uuid } = await createWorkspace(session, ORIGINAL_NAME)
    await safePage.goto(`${SETTINGS_PATH}?spaceId=${uuid}`)
    await expect(nameInput(safePage)).toHaveValue(ORIGINAL_NAME)

    await rename(safePage, NEW_NAME)

    await expect(toast(safePage, 'Workspace name updated')).toBeVisible()
    await expect(safePage).toHaveURL(workspaceUrl(SETTINGS_PATH, uuid))
    await expect.poll(() => workspaceName(session, uuid)).toBe(NEW_NAME)
  })
})
