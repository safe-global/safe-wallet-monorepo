import * as constants from '../../support/constants.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'

let staticSafes = []

describe('[SMOKE] Safe Apps tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('[SMOKE] Verify the Safe Apps list is displayed', () => {
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
    // Wait for app cards to render inside the list
    cy.get('[data-testid="apps-list"]', { timeout: 30000 })
      .should('be.visible')
      .find('li')
      .should('have.length.at.least', 1)
  })

  it('[SMOKE] Verify Safe Apps search filters results', () => {
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
    cy.get('[data-testid="apps-list"]', { timeout: 30000 }).should('be.visible')
    cy.get('input[id="search-by-name"]').type('Transaction Builder')
    // Wait for filtered results to display the matching app
    cy.contains('Transaction Builder').should('be.visible')
  })

  it('[SMOKE] Verify Safe Apps search shows no results state', () => {
    cy.visit(constants.appsUrlGeneral + staticSafes.SEP_STATIC_SAFE_2)
    cy.get('[data-testid="apps-list"]', { timeout: 30000 }).should('be.visible')
    cy.get('input[id="search-by-name"]').type('zzzznonexistentapp12345')
    // Wait for the empty state message
    cy.contains(/no Safe Apps found/i).should('be.visible')
  })
})
