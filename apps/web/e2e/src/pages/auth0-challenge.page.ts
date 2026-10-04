/**
 * Auth0 Universal Login pages: email sign-in, the emailed code, and the authenticator (OTP) challenge that both sign-in
 * and a step-up (`/v1/auth/oidc/authorize?elevate=true`) end on. Locators and actions only.
 */
import type { Locator, Page } from '@playwright/test'
import { generateTotp, secondsLeftInStep } from '../utils/totp'

const AUTH0_HOST = /\.auth0\.com\//
const OTP_CHALLENGE = /\.auth0\.com\/u\/mfa-otp-challenge/
// A code typed in the last seconds of its step can expire before Auth0 checks it.
const MIN_SECONDS_LEFT = 5
let lastSubmittedStep = 0

export class Auth0Page {
  readonly emailInput: Locator
  readonly codeInput: Locator
  readonly continueBtn: Locator
  readonly invalidCodeError: Locator

  constructor(private readonly page: Page) {
    this.emailInput = page.locator('input[name="username"], input[name="email"]').first()
    this.codeInput = page.locator('input[name="code"]')
    this.continueBtn = page.getByRole('button', { name: 'Continue', exact: true })
    this.invalidCodeError = page.getByText(/code you entered is invalid/i)
  }

  async submitEmail(email: string): Promise<void> {
    await this.page.waitForURL(AUTH0_HOST)
    await this.emailInput.fill(email)
    await this.continueBtn.click()
  }

  async waitForChallenge(timeout?: number): Promise<void> {
    await this.page.waitForURL(OTP_CHALLENGE, { timeout })
    await this.codeInput.waitFor({ state: 'visible' })
  }

  async submitCode(code: string): Promise<void> {
    await this.codeInput.fill(code)
    await this.continueBtn.click()
  }

  /** Auth0 rejects a code that was already used, so wait for a fresh 30 s step when the last one was spent. */
  async submitAuthenticatorCode(totpSecret: string): Promise<void> {
    const currentStep = () => Math.floor(Date.now() / 30_000)
    if (currentStep() <= lastSubmittedStep || secondsLeftInStep() < MIN_SECONDS_LEFT) {
      await this.page.waitForTimeout((secondsLeftInStep() + 1) * 1000)
    }
    lastSubmittedStep = currentStep()
    await this.submitCode(generateTotp(totpSecret))
  }

  /** Passes the challenge and waits until the browser is back on the app. */
  async completeWithAuthenticator(totpSecret: string, timeout?: number): Promise<void> {
    await this.waitForChallenge(timeout)
    await this.submitAuthenticatorCode(totpSecret)
    await this.page.waitForURL((url) => !AUTH0_HOST.test(url.href) && !/\/v1\/auth\/oidc\//.test(url.pathname), {
      timeout: 60_000,
    })
    await this.page.waitForLoadState('networkidle').catch(() => undefined)
  }
}
