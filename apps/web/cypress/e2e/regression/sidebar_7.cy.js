import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import * as owner from '../pages/owners.pages.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer1 = walletCredentials.OWNER_1_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_3_PRIVATE_KEY

describe('Sidebar tests 7', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify Import/export buttons are present', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.addedSafes)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe1)
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafes.safe2)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    main.checkButtonByTextExists(sideBar.importBtnStr)
    main.checkButtonByTextExists(sideBar.exportBtnStr)
  })

  it('Verify that safes the user do not owns show in the watchlist after adding them', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set4)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer1)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafes.safe3short])
  })

  it('Verify that safes that the user owns do show in the watchlist after adding them', () => {
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set4)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    wallet.connectSigner(signer1)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafes.safe3short])
  })

  // Added to prod
  it('Verify pending signature is displayed in sidebar for unsigned tx', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafesPendingActions.safe1)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.verifyTxToConfirmDoesNotExist()
    owner.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
    wallet.connectSigner(signer2)
    sideBar.verifyAddedSafesExist([sideBar.sideBarSafesPendingActions.safe1short])
    sideBar.checkTxToConfirm(1)
  })

  // Added to prod
  it('Verify balance exists in a tx in sidebar', () => {
    main.addSafeToTrustedList('11155111', sideBar.sideBarSafesPendingActions.safe1)
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.verifyTxToConfirmDoesNotExist()
    sideBar.checkBalanceExists()
  })
})
