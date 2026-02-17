import * as constants from '../../../support/constants.js'
import * as main from '../../pages/main.page.js'
import * as sideBar from '../../pages/sidebar.pages.js'
import * as ls from '../../../support/localstorage_data.js'

describe('[VISUAL] Welcome page screenshots', { defaultCommandTimeout: 60000, ...constants.VISUAL_VIEWPORT }, () => {
  it('[VISUAL] Screenshot welcome page', () => {
    cy.visit(constants.welcomeUrl)
    cy.contains('Own your assets onchain securely', { timeout: 30000 }).should('be.visible')
  })

  it('[VISUAL] Screenshot accounts page with added safes', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1)
    cy.visit(constants.welcomeAccountUrl)
    cy.get(sideBar.sideSafeListItem, { timeout: 30000 }).should('be.visible')
  })
})
