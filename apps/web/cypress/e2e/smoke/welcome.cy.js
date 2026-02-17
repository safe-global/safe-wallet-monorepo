import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as ls from '../../support/localstorage_data.js'

describe('[SMOKE] Welcome page tests', { defaultCommandTimeout: 60000 }, () => {
  it('[SMOKE] Verify the welcome page is displayed with login card and hero', () => {
    cy.visit(constants.welcomeUrl)
    // Wait for the login card and hero content to fully render
    cy.contains('Get started', { timeout: 30000 }).should('be.visible')
    cy.contains('Own your assets onchain securely').should('be.visible')
  })

  it('[SMOKE] Verify the accounts page shows added safes', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1)
    // Visit the accounts page directly to see the safe list
    cy.visit(constants.welcomeAccountUrl)
    // Wait for safe list items to render
    cy.get('[data-testid="safe-list-item"]', { timeout: 30000 }).should('have.length.at.least', 1)
  })
})
