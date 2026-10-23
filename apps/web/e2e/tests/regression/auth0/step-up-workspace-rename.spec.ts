/**
 * Step-up authentication for a sensitive Workspace action, end to end against the gateway and the local Auth0.
 *
 * The user signs in by email without a second factor, so the gateway answers the rename with
 * `elevation_required`. The wallet asks for a code in a popup and then sends the rename again, on the page the
 * user is on. Without the step-up the name must not change.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../../src/fixtures/test.fixture'
import {
  createWorkspace,
  signInWithEmail,
  uniqueEmail,
  workspaceName,
  workspaceUrl,
  type EmailSession,
} from '../../../src/fixtures/email-session'
import { Auth0Page } from '../../../src/pages/auth0.page'
import {
  clickVerify,
  completeStepUp,
  expectActionCompleted,
  expectSamePage,
  openStepUpPopup,
  stepUpDialog,
} from '../../../src/fixtures/step-up'

const ORIGINAL_NAME = 'Step-up Workspace'
const NEW_NAME = 'Renamed after step-up'
const RENAMED = 'Workspace name updated'
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

    await expectActionCompleted(safePage, settingsUrl, RENAMED)
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)
    await expect.poll(() => workspaceName(session, workspaceId)).toBe(NEW_NAME)
  })

  test('that cancelling on Auth0 keeps the form, and the user can save again', async ({ safePage }) => {
    await rename(safePage, NEW_NAME)
    const auth0 = await openStepUpPopup(safePage)
    await auth0.cancelButton.click()

    await expectSamePage(safePage)
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)
    expect(await workspaceName(session, workspaceId)).toBe(ORIGINAL_NAME)

    await safePage.getByTestId('space-save-button').click()
    await completeStepUp(safePage)

    await expectActionCompleted(safePage, settingsUrl, RENAMED)
    await expect.poll(() => workspaceName(session, workspaceId)).toBe(NEW_NAME)
  })

  test('that cancelling the dialog keeps the form without a rename', async ({ safePage }) => {
    await rename(safePage, NEW_NAME)
    await expect(stepUpDialog(safePage)).toBeVisible()
    await safePage.getByTestId('step-up-cancel-button').click()

    await expect(stepUpDialog(safePage)).toBeHidden()
    await expect(safePage).toHaveURL(settingsUrl)
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)
    expect(await workspaceName(session, workspaceId)).toBe(ORIGINAL_NAME)
  })

  test('that the dialog reports a failure when Auth0 does not report the second factor', async ({ safePage }) => {
    await rename(safePage, NEW_NAME)
    const popup = await clickVerify(safePage)
    const popupClosed = popup.waitForEvent('close')
    await new Auth0Page(popup).verify({ reportSecondFactor: false })

    await expect(stepUpDialog(safePage)).toContainText('Verification was not completed')
    await popupClosed
    expect(await workspaceName(session, workspaceId)).toBe(ORIGINAL_NAME)

    // "Try again" opens the popup from the same dialog; this time the second factor is reported.
    await completeStepUp(safePage)

    await expectActionCompleted(safePage, settingsUrl, RENAMED)
    await expect.poll(() => workspaceName(session, workspaceId)).toBe(NEW_NAME)
  })

  test('that a second sensitive action right after a step-up needs no new code', async ({ safePage }) => {
    await rename(safePage, NEW_NAME)
    await completeStepUp(safePage)
    await expectActionCompleted(safePage, settingsUrl, RENAMED)

    // The elevation belongs to the session, not to the page: a reload keeps it, and settles the form.
    await safePage.reload()
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)
    await rename(safePage, 'Renamed again')

    await expect.poll(() => workspaceName(session, workspaceId)).toBe('Renamed again')
    await expect(stepUpDialog(safePage)).toBeHidden()
    await expect(safePage).toHaveURL(settingsUrl)
  })
})

test.describe('Workspace rename after a sign-in with a second factor', { tag: '@regression' }, () => {
  test('that the rename needs no step-up while the sign-in second factor is recent', async ({ safePage }) => {
    const session = await signInWithEmail(safePage, uniqueEmail('fresh-mfa'))
    const { uuid } = await createWorkspace(session, ORIGINAL_NAME)
    await safePage.goto(`${SETTINGS_PATH}?spaceId=${uuid}`)
    await expect(nameInput(safePage)).toHaveValue(ORIGINAL_NAME)

    await rename(safePage, NEW_NAME)

    await expect(safePage.getByRole('alert').filter({ hasText: RENAMED })).toBeVisible()
    await expect(stepUpDialog(safePage)).toBeHidden()
    await expect(safePage).toHaveURL(workspaceUrl(SETTINGS_PATH, uuid))
    await expect.poll(() => workspaceName(session, uuid)).toBe(NEW_NAME)
  })
})
