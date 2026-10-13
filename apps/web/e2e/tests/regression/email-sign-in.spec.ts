/**
 * Email sign-in through the gateway and the local Auth0 of the isolated stack: the gateway redirects to Auth0,
 * the user enters an email and a one-time code, and the gateway sends them back to the wallet with a session.
 */
import { test, expect } from '../../src/fixtures/test.fixture'
import { isIsolated } from '../../src/fixtures/isolated-data'
import { openEmailSignIn, sessionAuthMethod, uniqueEmail } from '../../src/fixtures/email-session'

test.describe('Email sign-in', { tag: '@regression' }, () => {
  test.skip(!isIsolated, 'Needs the local Auth0 of the isolated stack')

  test('that a new user signs in with an email and a code and returns to the Workspace welcome page', async ({
    safePage,
  }) => {
    const auth0 = await openEmailSignIn(safePage)

    await auth0.signIn(uniqueEmail('sign-in'))

    await expect(safePage).toHaveURL(/\/welcome\/spaces$/)
    await expect(safePage.getByRole('button', { name: 'Continue with email' })).toBeHidden()
    await expect.poll(() => sessionAuthMethod(safePage)).toBe('oidc')
  })

  test('that a wrong code keeps the user on the code page and the right code then signs in', async ({ safePage }) => {
    const email = uniqueEmail('wrong-code')
    const auth0 = await openEmailSignIn(safePage)

    await auth0.signIn(email, { code: '000000' })

    await expect(auth0.error).toHaveText('Wrong code. Try again.')
    expect(await sessionAuthMethod(safePage)).toBeNull()

    await auth0.signIn(email)

    await expect(safePage).toHaveURL(/\/welcome\/spaces$/)
    await expect.poll(() => sessionAuthMethod(safePage)).toBe('oidc')
  })

  test('that cancelling returns the user to the Workspace welcome page without a session', async ({ safePage }) => {
    const auth0 = await openEmailSignIn(safePage)

    await auth0.cancelButton.click()

    await expect(safePage).toHaveURL(/\/welcome\/spaces/)
    await expect(safePage.getByRole('button', { name: 'Continue with email' })).toBeVisible()
    expect(await sessionAuthMethod(safePage)).toBeNull()
  })
})
