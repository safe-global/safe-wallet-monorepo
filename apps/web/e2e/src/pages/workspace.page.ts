/**
 * Workspace screens the step-up suite drives: onboarding, Safe accounts, address book, team, settings and plans.
 * Locators and actions only; assertions live in the specs.
 */
import type { Locator, Page } from '@playwright/test'

const SEPOLIA = /^Sepolia/

export class WorkspacePage {
  constructor(private readonly page: Page) {}

  get dialog(): Locator {
    return this.page.locator('[role=dialog]:visible, [role=alertdialog]:visible').last()
  }

  row(text: string | RegExp): Locator {
    return this.page.locator('tr', { hasText: text }).first()
  }

  async goto(path: string, spaceId: string): Promise<void> {
    await this.page.goto(`${path}?spaceId=${spaceId}`)
    await this.page.waitForLoadState('networkidle').catch(() => undefined)
  }

  /** Closes the "free access is active" and "account is all set" modals that follow Stripe and Safe creation. */
  async closeWelcomeModals(appearWithin = 10_000): Promise<void> {
    const cta = this.page.getByRole('dialog').getByRole('button', { name: /Get started|Let.s go/i })
    await cta
      .first()
      .waitFor({ timeout: appearWithin })
      .catch(() => undefined)
    for (let i = 0; i < 3 && (await cta.first().isVisible()); i++) {
      await cta.first().click()
      await this.page.waitForTimeout(1000)
    }
  }

  // Onboarding

  /** The Workspace id once the app has put it in the URL (onboarding adds it after creating the Workspace). */
  async spaceIdFromUrl(): Promise<string> {
    await this.page.waitForURL(/[?&]spaceId=[0-9a-f-]{36}/, { timeout: 60_000 })
    return new URL(this.page.url()).searchParams.get('spaceId') as string
  }

  async createWorkspace(name: string): Promise<void> {
    await this.page.goto('/welcome/create-space')
    await this.page.waitForLoadState('networkidle').catch(() => undefined)
    const input = this.page.getByLabel('Workspace name')
    // The field re-renders once the session check settles and drops what was typed before.
    for (let i = 0; i < 5 && (await input.inputValue()) !== name; i++) {
      await input.fill(name)
      await this.page.waitForTimeout(1000)
    }
    await this.page.getByTestId('create-space-onboarding-continue-button').click()
  }

  get claimFreeAccess(): Locator {
    return this.page.getByRole('button', { name: /Claim free access/i })
  }

  async waitForTrialOffer(): Promise<void> {
    const retry = this.page.getByRole('button', { name: /Try again/ })
    await this.claimFreeAccess.or(retry).first().waitFor({ timeout: 60_000 })
    if (await retry.isVisible()) await retry.click()
    await this.claimFreeAccess.waitFor({ timeout: 60_000 })
  }

  async startStripeTrial(email: string): Promise<void> {
    const page = this.page
    await page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 })
    await page.waitForLoadState('networkidle').catch(() => undefined)
    const emailInput = page.locator('input[name=email]')
    if ((await emailInput.isEditable().catch(() => false)) && !(await emailInput.inputValue())) {
      await emailInput.fill(email)
    }
    for (const field of [page.locator('input[name=Name]'), page.getByPlaceholder('Full name')]) {
      if (await field.isVisible().catch(() => false)) await field.fill('Step-up QA')
    }
    await page.locator('input[name=billingName]').fill('Step-up QA')
    await page.locator('select[name=billingCountry]').selectOption('DE')
    await page.locator('input[name=billingAddressLine1]').fill('Unter den Linden 1')
    await page
      .getByText('Berlin, Germany', { exact: true })
      .first()
      .click({ timeout: 5_000 })
      .catch(() => undefined)
    const postalCode = page.locator('input[name=billingPostalCode]')
    if (!(await postalCode.inputValue().catch(() => ''))) await postalCode.fill('10117')
    const city = page.locator('input[name=billingLocality]')
    if (!(await city.inputValue().catch(() => ''))) await city.fill('Berlin')
    await page
      .locator('input[name=termsOfServiceConsentCheckbox]')
      .check({ force: true })
      .catch(() => undefined)
    await page
      .getByRole('button', { name: /Start trial|Start for free|Subscribe/i })
      .last()
      .click()
    await page.waitForURL((url) => !url.hostname.includes('stripe.com'), { timeout: 90_000 })
  }

  async leaveStripeCheckout(): Promise<void> {
    await this.page.waitForURL(/checkout\.stripe\.com/, { timeout: 60_000 })
    await this.page.waitForLoadState('networkidle').catch(() => undefined)
    await this.page.goBack()
  }

  async skipSelectSafes(): Promise<void> {
    await this.page.getByRole('button', { name: /^Skip, add Safe/i }).click()
  }

  async inviteInOnboarding(address: string): Promise<void> {
    await this.page.locator('input[name="members.0.identifier"]').fill(address)
    await this.page.getByRole('button', { name: /^Next$/ }).click()
  }

  async finishSurvey(): Promise<void> {
    await this.page.getByTestId('survey-option-card').first().click()
    await this.page.getByRole('button', { name: /^Create Workspace$/ }).click()
  }

  // Safe accounts

  /** Opens Add accounts → Select from my accounts → Add manually and adds a Sepolia Safe, then names it. */
  async addSafeByAddress(address: string, name: string): Promise<void> {
    await this.page
      .getByRole('button', { name: /^Add accounts$/ })
      .first()
      .click()
    await this.page.getByText(/Select from my accounts|Manage accounts/).click()
    await this.page.getByTestId('add-manually-button').click()
    await this.page.getByTestId('network-selector').getByRole('combobox').click()
    await this.page.getByTestId('network-item').filter({ hasText: SEPOLIA }).first().click()
    await this.page.getByTestId('add-address-input').locator('input[name=address]').fill(address)
    await this.page.getByTestId('add-space-account-manually-button').click()
    await this.page.getByTestId('add-accounts-button').click()
    await this.page.getByTestId('name-accounts-region').locator('input').first().fill(name)
  }

  async submitAddAccounts(): Promise<void> {
    await this.page.getByTestId('add-accounts-button').click()
  }

  async openSafeActions(address: RegExp): Promise<void> {
    await this.row(address).getByLabel('Safe Account actions').click()
  }

  async renameSafe(address: RegExp, name: string): Promise<void> {
    await this.openSafeActions(address)
    await this.page.getByTestId('space-safe-rename-btn').click()
    await this.dialog.locator('input').first().fill(name)
    await this.dialog
      .getByRole('button', { name: /Save|Rename|Confirm/i })
      .last()
      .click()
  }

  async removeSafe(address: RegExp): Promise<void> {
    await this.openSafeActions(address)
    await this.page.getByRole('menuitem', { name: 'Remove from Workspace' }).click()
    await this.dialog.getByRole('button', { name: /^Remove$/ }).click()
  }

  async addSafeFromSafeSidebar(workspaceName: string): Promise<void> {
    await this.page.getByTestId('add-safe-to-workspace-button').click()
    await this.page
      .locator('[role=menuitem]:not([aria-disabled="true"])', { hasText: workspaceName })
      .first()
      .click({ timeout: 15_000 })
  }

  /** Create new Safe from the Workspace: names it, optionally adds networks, and picks Pay later. */
  async createSafePayLater(name: string, extraNetworks: RegExp[] = []): Promise<void> {
    await this.page
      .getByRole('button', { name: /^Add accounts$/ })
      .first()
      .click()
    await this.page
      .getByText(/^Create new/)
      .first()
      .click()
    await this.page.waitForURL(/\/new-safe\/create/)
    await this.page.locator('input[name=name]').fill(name)
    for (const network of extraNetworks) {
      await this.page.locator('[role=combobox]').first().click()
      await this.page.locator('[role=option]:visible', { hasText: network }).first().click()
      await this.page.keyboard.press('Escape')
    }
    await this.page.getByRole('button', { name: /^Next$/ }).click()
    await this.page.getByRole('button', { name: /^Next$/ }).click()
    await this.page.getByText('Pay later with the first transaction').click()
    await this.page.getByRole('button', { name: /Create account/i }).click()
  }

  // Address book

  async addSharedContact(name: string, address: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Add shared contact' }).click()
    await this.dialog.locator('input[name=name]').fill(name)
    await this.dialog.locator('input[name=address]').fill(address)
    await this.dialog.getByRole('button', { name: 'Add contact' }).click()
  }

  async editContactName(current: string, name: string): Promise<void> {
    await this.row(current).getByRole('button', { name: 'Edit entry' }).click()
    await this.dialog.locator('input[name=name]').fill(name)
    await this.dialog
      .getByRole('button', { name: /Save|Update|Edit/ })
      .last()
      .click()
  }

  async deleteContact(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Delete entry' }).click()
    await this.dialog
      .getByRole('button', { name: /Delete|Remove|Confirm/ })
      .last()
      .click()
  }

  async addLocalContact(name: string, address: string): Promise<void> {
    await this.page
      .getByText(/^Local contacts/)
      .first()
      .click()
    await this.page.getByRole('button', { name: 'Add contact' }).click()
    await this.dialog.locator('input[name=name]').fill(name)
    await this.dialog.locator('input[name=address]').fill(address)
    await this.dialog
      .getByRole('button', { name: /Add contact|Save|Add/ })
      .last()
      .click()
  }

  async importLocalContacts(): Promise<void> {
    await this.page
      .getByText(/^Workspace contacts/)
      .first()
      .click()
    await this.page.getByRole('button', { name: 'Import' }).click()
    const checkbox = this.dialog.locator('[role=checkbox]').first()
    if ((await checkbox.count()) && (await checkbox.getAttribute('aria-checked')) !== 'true') await checkbox.click()
    await this.dialog
      .getByRole('button', { name: /Import/ })
      .last()
      .click()
  }

  async requestToAdd(name: string): Promise<void> {
    await this.row(name).getByRole('button', { name: 'Request to add' }).click()
    await this.dialog.getByRole('button', { name: 'Request to add' }).click()
  }

  async approveRequest(name: string): Promise<void> {
    await this.page
      .getByText(/^Pending/)
      .first()
      .click()
    await this.row(name).getByTestId('approve-request-btn').click()
  }

  // Team

  async inviteMember(name: string, identifier: string): Promise<void> {
    await this.page.getByTestId('add-member-button').click()
    await this.dialog.getByTestId('member-name-input').fill(name)
    await this.dialog.locator('#member-invitee-identifier-input').fill(identifier)
    await this.dialog.getByRole('button', { name: 'Add member' }).click()
  }

  async removeInvitation(identifier: RegExp): Promise<void> {
    await this.page.getByTestId('pending-members-tab').click()
    await this.row(identifier).getByRole('button', { name: 'Remove invitation' }).click()
    await this.dialog
      .getByRole('button', { name: /^Remove/ })
      .last()
      .click()
  }

  async setMemberRole(name: string, role: 'Admin' | 'Member'): Promise<void> {
    await this.page.getByTestId('members-tab').click()
    await this.row(name).getByRole('button', { name: 'Edit member' }).click()
    await this.dialog.getByRole('combobox').first().click()
    await this.page.getByRole('option', { name: new RegExp(`^${role}`) }).click()
    await this.dialog.getByRole('button', { name: /Update/ }).click()
  }

  async removeMember(name: string): Promise<void> {
    await this.page.getByTestId('members-tab').click()
    await this.row(name).getByRole('button', { name: 'Remove member' }).click()
    await this.dialog
      .getByRole('button', { name: /^Remove/ })
      .last()
      .click()
  }

  async acceptInvite(name: string): Promise<void> {
    await this.page.getByRole('button', { name: 'Accept' }).first().click()
    const input = this.dialog.locator('input').first()
    if (!(await input.inputValue())) await input.fill(name)
    await this.dialog.getByRole('button', { name: 'Accept invite' }).click()
  }

  // Settings

  async renameWorkspace(name: string): Promise<void> {
    await this.page.getByTestId('space-name-input').fill(name)
    await this.page.getByTestId('space-save-button').click()
  }

  // Plans

  /** Plans → Switch to Starter, deselecting Safes until `keep` remain when the trim step shows, up to the confirmation. */
  async switchToStarter(keep: number): Promise<void> {
    await this.page.getByRole('button', { name: 'Switch to Starter' }).click()
    await this.trimTo(keep, /Continue to downgrade/)
  }

  async trimTo(keep: number, continueLabel: RegExp): Promise<void> {
    const proceed = this.dialog.getByRole('button', { name: continueLabel })
    await proceed
      .or(this.dialog.getByRole('button', { name: /Confirm change/ }))
      .first()
      .waitFor()
    if (!(await proceed.isVisible())) return
    const rows = this.dialog.locator('[role=checkbox][aria-checked=true]')
    while ((await rows.count()) > keep) await rows.last().click()
    await proceed.last().click()
  }

  async confirmPlanChange(): Promise<void> {
    await this.dialog.getByRole('button', { name: /Confirm change/ }).click()
  }
}
