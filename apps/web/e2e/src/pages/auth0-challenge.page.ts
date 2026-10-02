/**
 * Auth0 Universal Login challenge pages reached through a step-up
 * (`/v1/auth/oidc/authorize?elevate=true`). Locators and actions only; assertions live in the specs.
 */
import type { Locator, Page } from '@playwright/test'
import { generateTotp, secondsLeftInStep } from '../utils/totp'

const AUTH0_HOST = /\.auth0\.com\//
// A code typed in the last seconds of its step can expire before Auth0 checks it.
const MIN_SECONDS_LEFT = 5

export class Auth0ChallengePage {
  readonly codeInput: Locator
  readonly continueBtn: Locator
  readonly tryAnotherMethod: Locator
  readonly invalidCodeError: Locator

  constructor(private readonly page: Page) {
    this.codeInput = page.locator('input[name="code"]')
    this.continueBtn = page.getByRole('button', { name: 'Continue', exact: true })
    this.tryAnotherMethod = page.getByRole('button', { name: 'Try another method' })
    this.invalidCodeError = page.getByText('The code you entered is invalid')
  }

  async waitForChallenge(): Promise<void> {
    await this.page.waitForURL(AUTH0_HOST)
    await this.codeInput.waitFor({ state: 'visible' })
  }

  async submitCode(code: string): Promise<void> {
    await this.codeInput.fill(code)
    await this.continueBtn.click()
  }

  async submitAuthenticatorCode(totpSecret: string): Promise<void> {
    const secondsLeft = secondsLeftInStep()
    if (secondsLeft < MIN_SECONDS_LEFT) await this.page.waitForTimeout((secondsLeft + 1) * 1000)
    await this.submitCode(generateTotp(totpSecret))
  }

  /** Passes the challenge and waits until the browser is back on the app. */
  async completeWithAuthenticator(totpSecret: string): Promise<void> {
    await this.waitForChallenge()
    await this.submitAuthenticatorCode(totpSecret)
    await this.page.waitForURL((url) => !AUTH0_HOST.test(url.href) && !/\/v1\/auth\/oidc\//.test(url.pathname))
    await this.page.waitForLoadState('networkidle')
  }
}
