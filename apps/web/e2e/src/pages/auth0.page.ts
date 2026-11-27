/**
 * The local Auth0 sign-in and step-up page of the isolated stack (environment/infra/mocks/auth0-api.ts).
 *
 * Rule: Page Objects hold locators and actions. Assertions belong in the test file.
 */
import { type Locator, type Page } from '@playwright/test'

/** The one code the local Auth0 accepts */
export const AUTH0_CODE = '123456'

export class Auth0Page {
  readonly signInHeading: Locator
  readonly stepUpHeading: Locator
  readonly email: Locator
  readonly code: Locator
  readonly withoutSecondFactor: Locator
  readonly withoutReportedSecondFactor: Locator
  readonly continueButton: Locator
  readonly cancelButton: Locator
  readonly error: Locator

  constructor(page: Page) {
    this.signInHeading = page.getByRole('heading', { name: 'Sign in' })
    this.stepUpHeading = page.getByRole('heading', { name: "Verify it's you" })
    this.email = page.getByLabel('Email')
    this.code = page.getByLabel('Code')
    this.withoutSecondFactor = page.getByLabel('Sign in without a second factor')
    this.withoutReportedSecondFactor = page.getByLabel('Do not report the second factor')
    this.continueButton = page.getByRole('button', { name: 'Continue' })
    this.cancelButton = page.getByRole('button', { name: 'Cancel' })
    this.error = page.getByRole('alert')
  }

  /** Signs in; without a second factor, the next sensitive action asks for a step-up. */
  async signIn(email: string, { secondFactor = true, code = AUTH0_CODE } = {}): Promise<void> {
    await this.email.fill(email)
    await this.code.fill(code)
    if (!secondFactor) await this.withoutSecondFactor.check()
    await this.continueButton.click()
  }

  /** Answers a step-up; without a reported second factor, the gateway must refuse it. */
  async verify({ code = AUTH0_CODE, reportSecondFactor = true } = {}): Promise<void> {
    await this.code.fill(code)
    if (!reportSecondFactor) await this.withoutReportedSecondFactor.check()
    await this.continueButton.click()
  }
}
