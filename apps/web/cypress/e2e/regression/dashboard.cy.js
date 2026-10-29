import * as constants from '../../support/constants'
import * as dashboard from '../pages/dashboard.pages'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Dashboard tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  // Mastercopy warnings (Action Required panel) — see specs/002-cypress-banner-actioncard-migration
  //we need 1.1.1 test save - deployment tbd
  it('Verify that aligable for migration mastercopy shows Warning card with unsupported copy and Migrate CTA', () => {
    cy.visit(constants.homeUrl + staticSafes.MATIC_STATIC_SAFE_31)

    dashboard.verifyActionRequiredCard({
      messages: [dashboard.unsupportedMastercopyTitle, dashboard.unsupportedMigratableContent],
      actionTestId: dashboard.mastercopyActions.migrate,
    })
    dashboard.clickActionInPanel(dashboard.mastercopyActions.migrate)
    dashboard.verifyMigrateSafeFlowOpened()
  })
})
