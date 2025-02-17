import * as constants from '../../support/constants.js'
import * as sideBar from '../pages/sidebar.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as main from '../pages/main.page.js'
import * as ls from '../../support/localstorage_data.js'
import * as owner from '../pages/owners.pages.js'
import * as navigation from '../pages/navigation.page.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const signer2 = walletCredentials.OWNER_3_PRIVATE_KEY
const signer3 = walletCredentials.OWNER_1_PRIVATE_KEY

const currentSafe = '0x9870...fec0'
const currentSafe2 = '0x5912...fFdb'
const multiChainSafe = 'matic:0xC96e...ee3B'

describe('Sidebar tests 8', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  it('Verify that the current safe is under the "Current safe account" section', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.verifyCurrentSafe(currentSafe)
  })

  it('Verify that for multichain safes, only the safe of the current network is listed in "Current safe acount"', () => {
    wallet.connectSigner(signer)
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.verifyCurrentSafe(multiChainSafe)
  })

  it('Verify that pinning a safe removes "Current safe account" section', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.clickOnBookmarkBtn(currentSafe)
    sideBar.verifyCurrentSafeDoesNotExist()
  })

  it('Verify the "Not activated" tag for Counterfactual safes', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safe1)
    wallet.connectSigner(signer)
    sideBar.openSidebar()
    sideBar.verifyAccountListSafeData([sideBar.notActivatedStr])
  })

  it('Verify the "Add another network" shows only for owners of a safe', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    wallet.connectSigner(signer2)
    sideBar.openSidebar()
    sideBar.clickOnSafeItemOptionsBtn(currentSafe2)
    sideBar.checkAddChainDialogDisplayed()
    owner.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify the "Add another network" is not displated for non-owners', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    wallet.connectSigner(signer3)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.clickOnSafeItemOptionsBtn(currentSafe2)
    main.verifyElementsCount(sideBar.safeItemOptionsAddChainBtn, 0)
    owner.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify New Transaction button is enabled for proposers', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_31)
    wallet.connectSigner(signer3)
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    owner.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify "Add read-only" button replaces the "New transaction" button for disconnected users', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    navigation.verifyTxBtnStatus(constants.enabledStates.disabled)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.verifyCurrentSafeReadOnly(1)
  })

  it('Verify "Add read-only" button replaces the "New transaction" button for connected non-owners', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    wallet.connectSigner(signer3)
    navigation.verifyTxBtnStatus(constants.enabledStates.disabled)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.verifyCurrentSafeReadOnly(1)
    owner.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify Add safe button takes the user to the "Safe load" flow', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    navigation.verifyTxBtnStatus(constants.enabledStates.disabled)
    cy.intercept('GET', constants.safeListEndpoint, { 1: [], 100: [], 137: [], 11155111: [] })
    sideBar.openSidebar()
    sideBar.clickOnAddSafeBtn()
  })

  it('Verify "blockchain sync" status is shown at the bottom pointing to the network statuses', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_7)
    sideBar.verifyIndexStatusPresent()
  })
})
