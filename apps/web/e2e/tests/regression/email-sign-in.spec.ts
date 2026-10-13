/**
 * Email sign-in through the gateway and the local Auth0 of the isolated stack: the gateway redirects to Auth0,
 * the user enters an email and a one-time code, and the gateway sends them back to the wallet with a session.
 */
import type { Page } from '@playwright/test'
import { test, expect } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { openEmailSignIn, sessionAuthMethod, uniqueEmail } from '../../src/fixtures/email-session'

// The return from Auth0 is a page load: the app boots again behind its launch screen.
const launchScreen = (page: Page) => page.getByTestId('launch-screen')
const signedInAccount = (page: Page) => page.getByTestId('header-account-info')

test.describe('Email sign-in', { tag: '@regression' }, () => {
  test.skip(!isIsolated, 'Needs the local Auth0 of the isolated stack')

  test('that a new user signs in with an email and a code and returns to the Workspace welcome page', async ({
    safePage,
  }) => {
    const auth0 = await openEmailSignIn(safePage)

    await auth0.signIn(uniqueEmail('sign-in'))

    await expect(safePage).toHaveURL(/\/welcome\/spaces$/)
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(signedInAccount(safePage)).toContainText('@safe-e2e.test')
    await expect(safePage.getByRole('button', { name: 'Continue with email' })).toBeHidden()
    await expect.poll(() => sessionAuthMethod(safePage)).toBe('oidc')
  })

  test('that cancelling returns the user to the Workspace welcome page without a session', async ({ safePage }) => {
    const auth0 = await openEmailSignIn(safePage)

    await auth0.cancelButton.click()

    await expect(safePage).toHaveURL(/\/welcome\/spaces/)
    await expect(launchScreen(safePage)).toBeHidden()
    await expect(safePage.getByRole('button', { name: 'Continue with email' })).toBeVisible()
    await expect(signedInAccount(safePage)).toBeHidden()
    expect(await sessionAuthMethod(safePage)).toBeNull()
  })
})
