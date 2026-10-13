/**
 * Step-up authentication for a sensitive Workspace action, end to end against the gateway and the local Auth0.
 *
 * The user signs in by email without a second factor, so the gateway answers the rename with
 * `elevation_required`. The wallet sends the user to Auth0 for a code and, on return, repeats the rename on the
 * page the user left. Without the step-up the name must not change.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { createWorkspace, signInWithEmail, uniqueEmail, workspaceName } from '../../src/fixtures/email-session'
import { Auth0Page } from '../../src/pages/auth0.page'

const ORIGINAL_NAME = 'Step-up Workspace'
const NEW_NAME = 'Renamed after step-up'

// The return from Auth0 is a page load: the app boots again behind its launch screen.
const launchScreen = (page: Page) => page.getByTestId('launch-screen')
const nameInput = (page: Page) => page.getByTestId('space-name-input')

// Next.js renders its route announcer with role="alert" too.
const toast = (page: Page, text: string) => page.getByRole('alert').filter({ hasText: text })

async function rename(page: Page, name: string): Promise<void> {
  await page.getByTestId('space-name-input').fill(name)
  await page.getByTestId('space-save-button').click()
}

test.describe('Step-up for a Workspace rename', { tag: '@regression' }, () => {
  test.skip(!isIsolated, 'Needs the local Auth0 of the isolated stack')

  let workspaceId: string
  let settingsUrl: RegExp

  test.beforeEach(async ({ safePage }) => {
    await signInWithEmail(safePage, uniqueEmail('step-up'), { secondFactor: false })
    workspaceId = (await createWorkspace(safePage, ORIGINAL_NAME)).uuid
    settingsUrl = new RegExp(`/spaces/settings/general\\?spaceId=${workspaceId}$`)
    await safePage.goto(`/spaces/settings/general?spaceId=${workspaceId}`)
    await expect(safePage.getByTestId('space-name-input')).toHaveValue(ORIGINAL_NAME)
  })

  test('that the rename completes on the same page after the user enters the code', async ({ safePage }) => {
    const auth0 = new Auth0Page(safePage)

    await rename(safePage, NEW_NAME)
    await expect(auth0.stepUpHeading).toBeVisible()
    await auth0.verify()

    await expect(safePage).toHaveURL(settingsUrl)
    await expect(toast(safePage, 'Workspace updated')).toBeVisible()
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)
    await expect.poll(() => workspaceName(safePage, workspaceId)).toBe(NEW_NAME)
  })

  test('that cancelling returns the user to the page without an error and without the rename', async ({ safePage }) => {
    const auth0 = new Auth0Page(safePage)

    await rename(safePage, NEW_NAME)
    await auth0.cancelButton.click()

    await expect(safePage).toHaveURL(settingsUrl)
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(nameInput(safePage)).toHaveValue(ORIGINAL_NAME)
    await expect(toast(safePage, 'Verification was not completed')).toBeHidden()
    expect(await workspaceName(safePage, workspaceId)).toBe(ORIGINAL_NAME)
  })

  test('that the rename fails when Auth0 does not report the second factor', async ({ safePage }) => {
    const auth0 = new Auth0Page(safePage)

    await rename(safePage, NEW_NAME)
    await auth0.verify({ reportSecondFactor: false })

    await expect(safePage).toHaveURL(settingsUrl)
    await expect(toast(safePage, 'Verification was not completed')).toBeVisible()
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(nameInput(safePage)).toHaveValue(ORIGINAL_NAME)
    expect(await workspaceName(safePage, workspaceId)).toBe(ORIGINAL_NAME)
  })

  test('that a second sensitive action right after a step-up needs no new code', async ({ safePage }) => {
    const auth0 = new Auth0Page(safePage)
    await rename(safePage, NEW_NAME)
    await auth0.verify()
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(nameInput(safePage)).toHaveValue(NEW_NAME)

    await rename(safePage, 'Renamed again')

    await expect(toast(safePage, 'Workspace name updated')).toBeVisible()
    await expect(safePage).toHaveURL(settingsUrl)
    await expect.poll(() => workspaceName(safePage, workspaceId)).toBe('Renamed again')
  })
})

test.describe('Workspace rename after a sign-in with a second factor', { tag: '@regression' }, () => {
  test.skip(!isIsolated, 'Needs the local Auth0 of the isolated stack')

  test('that the rename needs no step-up while the sign-in second factor is recent', async ({ safePage }) => {
    await signInWithEmail(safePage, uniqueEmail('fresh-mfa'))
    const { uuid } = await createWorkspace(safePage, ORIGINAL_NAME)
    await safePage.goto(`/spaces/settings/general?spaceId=${uuid}`)
    await expect(safePage.getByTestId('space-name-input')).toHaveValue(ORIGINAL_NAME)

    await rename(safePage, NEW_NAME)

    await expect(toast(safePage, 'Workspace name updated')).toBeVisible()
    await expect(safePage).toHaveURL(new RegExp(`/spaces/settings/general\\?spaceId=${uuid}$`))
    await expect.poll(() => workspaceName(safePage, uuid)).toBe(NEW_NAME)
  })
})
