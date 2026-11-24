/**
 * Workspace Page Object — the creation wizard and its local trial checkout, the Workspace selector, the dashboard,
 * the Plans page and the invite banner.
 *
 * Rule: Page Objects hold locators and actions only. Assertions belong in the test file.
 */
import { type Page, type Locator } from '@playwright/test'

export class WorkspacePage {
  readonly createButton: Locator
  readonly nameInput: Locator
  readonly continueButton: Locator
  readonly planContinueButton: Locator
  readonly skipSafesLink: Locator
  readonly skipInviteButton: Locator
  readonly surveyOptions: Locator
  readonly finishSurveyButton: Locator
  readonly checkoutStartTrialButton: Locator
  readonly checkoutBackLink: Locator
  readonly trialActivatedDialog: Locator
  readonly currentPlanName: Locator
  readonly selectorButton: Locator
  readonly selectorMenu: Locator
  readonly totalValue: Locator
  readonly accountsWidget: Locator
  readonly accountRows: Locator
  readonly pendingItems: Locator
  readonly viewAllAccountsButton: Locator

  constructor(private readonly page: Page) {
    this.createButton = page.getByTestId('create-space-button').filter({ visible: true }).first()
    this.nameInput = page.getByTestId('space-name-input')
    this.continueButton = page.getByTestId('create-space-onboarding-continue-button')
    this.planContinueButton = page.getByTestId('plan-step-continue-button')
    this.skipSafesLink = page.getByTestId('select-safes-skip-link')
    this.skipInviteButton = page.getByTestId('invite-members-skip-button')
    this.surveyOptions = page.getByTestId('survey-option-card')
    this.finishSurveyButton = page.getByTestId('survey-finish-button')
    this.checkoutStartTrialButton = page.getByRole('button', { name: 'Start trial' })
    this.checkoutBackLink = page.getByRole('link', { name: 'Back' })
    this.trialActivatedDialog = page.getByRole('dialog', { name: /^Your free access is active/ })
    this.currentPlanName = page.getByTestId('current-plan-card').getByRole('heading', { level: 4 })
    this.selectorButton = page.getByTestId('space-selector-button')
    this.selectorMenu = page.getByTestId('space-selector-menu')
    this.totalValue = page.getByTestId('space-dashboard-total-value')
    this.accountsWidget = page.getByTestId('space-dashboard-accounts-widget')
    this.accountRows = this.accountsWidget.getByTestId('account-table-row')
    this.pendingItems = page.getByTestId('space-dashboard-pending-widget').locator('[data-slot="widget-item"]')
    this.viewAllAccountsButton = this.accountsWidget.getByTestId('widget-view-all')
  }

  async gotoDashboard(workspaceId: string): Promise<void> {
    await this.page.goto(`/spaces?spaceId=${workspaceId}`)
  }

  async gotoPlans(workspaceId: string): Promise<void> {
    await this.page.goto(`/spaces/plans?spaceId=${workspaceId}`)
  }

  trialSizeTab(seats: number): Locator {
    return this.page.getByRole('tab', { name: `${seats} Safes` })
  }

  /** From the first wizard step: name the Workspace, pick the trial for `seats` Safes and skip every optional step */
  async startTrialViaWizard(name: string, seats: number): Promise<void> {
    await this.nameInput.fill(name)
    await this.continueButton.click()
    await this.trialSizeTab(seats).click()
    await this.planContinueButton.click()
    await this.skipSafesLink.click()
    await this.skipInviteButton.click()
    await this.surveyOptions.first().click()
    await this.finishSurveyButton.click()
  }

  accountRow(name: string): Locator {
    return this.accountRows.filter({ hasText: name })
  }

  inviteBanner(workspaceName: string): Locator {
    return this.page.getByTestId('space-invite-banner').filter({ hasText: workspaceName })
  }

  /** Accept the invite to `workspaceName` from its banner, under the member name `memberName` */
  async acceptInvite(workspaceName: string, memberName: string): Promise<void> {
    await this.inviteBanner(workspaceName).getByTestId('accept-invite-button').click()
    await this.page.getByTestId('invite-name-input').fill(memberName)
    await this.page.getByTestId('confirm-accept-invite-button').click()
  }
}
