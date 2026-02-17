import * as constants from '../../../support/constants.js'
import * as main from '../../pages/main.page.js'
import * as ls from '../../../support/localstorage_data.js'

describe('[SMOKE] Welcome page tests', { defaultCommandTimeout: 60000 }, () => {
  it('[SMOKE] Verify that the welcome page is displayed', () => {
    cy.visit(constants.welcomeUrl)
    cy.contains('Own your assets onchain securely', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the accounts page shows added safes', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1)
    cy.visit(constants.welcomeAccountUrl)
    cy.get('[data-testid="safe-list-item"]', { timeout: 30000 }).should('be.visible')
  })
})
