import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import * as owner from '../pages/owners.pages.js'
import { acceptCookies2, closeSecurityNotice } from '../pages/main.page.js'
import * as createTx from '../pages/create_tx.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_3_PRIVATE_KEY

describe('[PROD] Sidebar tests 3', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify the "Accounts" counter at the top is counting all safes the user owns', () => {
    cy.visit(constants.prodbaseUrl + constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.contains(createTx.assetsStr, { timeout: 10000 })
    closeSecurityNotice()
    cy.intercept('GET', constants.safeListEndpoint, {
      11155111: [sideBar.sideBarSafes.safe1, sideBar.sideBarSafes.safe2],
    })
    wallet.connectSigner(signer)
    acceptCookies2()
    sideBar.openSidebar()
    sideBar.checkAccountsCounter('2')
  })

  // Re-enabled once it is merged to prod
  it.skip('Verify pending signature is displayed in sidebar for unsigned tx', () => {
    cy.visit(constants.prodbaseUrl + constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    cy.contains(createTx.assetsStr, { timeout: 10000 })
    closeSecurityNotice()
    wallet.connectSigner(signer)
    acceptCookies2()
    cy.intercept('GET', constants.safeListEndpoint, {
      11155111: [sideBar.sideBarSafesPendingActions.safe1],
    })
    sideBar.openSidebar()
    sideBar.verifyTxToConfirmDoesNotExist()
    owner.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    cy.intercept('GET', constants.safeListEndpoint, {
      11155111: [sideBar.sideBarSafesPendingActions.safe1],
    })
    wallet.connectSigner(signer2)
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafesPendingActions.safe1short])
    sideBar.checkTxToConfirm(2)
  })

  it('Verify balance exists in a tx in sidebar', () => {
    cy.visit(constants.prodbaseUrl + constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    cy.contains(createTx.assetsStr, { timeout: 10000 })
    closeSecurityNotice()
    wallet.connectSigner(signer)
    acceptCookies2()
    owner.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer)
    cy.intercept('GET', constants.safeListEndpoint, {
      11155111: [sideBar.sideBarSafesPendingActions.safe1],
    })
    sideBar.openSidebar()
    sideBar.verifyTxToConfirmDoesNotExist()
    sideBar.checkBalanceExists()
  })
})
