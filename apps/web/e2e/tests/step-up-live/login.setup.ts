/**
 * Signs the email user in once per run and saves the session for every spec. A saved session is reused while both the
 * CGW cookie and the Auth0 session are alive, so the emailed code is only needed every few days.
 */
import fs from 'node:fs'
import path from 'node:path'
import { test as setup, expect } from '../../src/fixtures/test.fixture'
import { getStepUpCredentials } from '../../src/data/step-up-credentials'
import { OIDC_STORAGE_STATE } from '../../src/data/step-up-paths'
import { Auth0Page } from '../../src/pages/auth0-challenge.page'
import { isSessionAlive } from '../../src/fixtures/step-up'

const credentials = getStepUpCredentials()
const EMAIL_CODE_TIMEOUT = 10 * 60_000

async function readEmailCode(file: string, requestedAt: number): Promise<string> {
  const deadline = Date.now() + EMAIL_CODE_TIMEOUT
  while (Date.now() < deadline) {
    if (fs.existsSync(file) && fs.statSync(file).mtimeMs > requestedAt) {
      const code = fs.readFileSync(file, 'utf8').trim()
      if (/^\d{6}$/.test(code)) return code
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error(`No 6-digit code was written to ${file} within ${EMAIL_CODE_TIMEOUT / 60_000} minutes.`)
}

setup('sign in with email and the authenticator', async ({ safePage, browserName }, testInfo) => {
  setup.setTimeout(EMAIL_CODE_TIMEOUT + 2 * 60_000)
  if (fs.existsSync(OIDC_STORAGE_STATE) && isSessionAlive(JSON.parse(fs.readFileSync(OIDC_STORAGE_STATE, 'utf8')))) {
    testInfo.annotations.push({ type: 'session', description: 'Reused the saved session' })
    return
  }
  if (!credentials.emailCodeFile && testInfo.project.use.headless !== false) {
    throw new Error('Sign-in needs the emailed code: run with --headed to type it, or set STEP_UP_EMAIL_CODE_FILE.')
  }

  const auth0 = new Auth0Page(safePage)
  await safePage.goto('/welcome/spaces')
  await safePage.getByTestId('email-login-btn').click()
  await auth0.submitEmail(credentials.email)
  const codeRequestedAt = Date.now()

  if (credentials.emailCodeFile) {
    console.log(`[step-up] Write the code emailed to ${credentials.email} into ${credentials.emailCodeFile}`)
    await auth0.submitCode(await readEmailCode(credentials.emailCodeFile, codeRequestedAt))
  } else {
    console.log(`[step-up] Type the code emailed to ${credentials.email} into the browser window (${browserName}).`)
  }

  await auth0.completeWithAuthenticator(credentials.totpSecret, EMAIL_CODE_TIMEOUT)
  await expect(safePage.getByTestId('email-login-btn')).toBeHidden()

  fs.mkdirSync(path.dirname(OIDC_STORAGE_STATE), { recursive: true })
  await safePage.context().storageState({ path: OIDC_STORAGE_STATE })
})
