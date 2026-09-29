import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as spendinglimit from '../pages/spending_limits.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('Spending limits non-owner tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    spendinglimit.turnOnSpendingLimitGate()
    cy.visit(constants.setupUrl + staticSafes.SEP_STATIC_SAFE_3)
    cy.get(spendinglimit.spendingLimitsSection).should('be.visible')
  })

  it('Verify that where there are no spending limits setup, information images are displayed', () => {
    spendinglimit.verifySpendingLimitsIcons()
  })

  it('Verify the Safe Pro lock replaces "New spending limit" for a visitor who is not signed in', () => {
    cy.get(spendinglimit.safeProLock).should('be.visible').and('contain', 'Adding spending limits requires Safe Pro')
    cy.get(spendinglimit.newSpendingLimitBtn).should('not.exist')
  })
})
