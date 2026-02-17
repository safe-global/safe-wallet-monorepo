import * as constants from '../../../support/constants.js'
import * as main from '../../pages/main.page.js'
import * as createWallet from '../../pages/create_wallet.pages.js'
import * as sideBar from '../../pages/sidebar.pages.js'
import * as ls from '../../../support/localstorage_data.js'

describe('[SMOKE] Welcome page tests', { defaultCommandTimeout: 60000 }, () => {
  it('[SMOKE] Verify that the welcome page is displayed with login card and hero', () => {
    cy.visit(constants.welcomeUrl)
    main.verifyElementsExist([createWallet.welcomeLoginScreen])
    cy.contains('Own your assets onchain securely', { timeout: 30000 }).should('be.visible')
  })

  it('[SMOKE] Verify that the accounts page shows added safes', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set1)
    cy.visit(constants.welcomeAccountUrl)
    sideBar.verifySafeCount(1)
  })
})
