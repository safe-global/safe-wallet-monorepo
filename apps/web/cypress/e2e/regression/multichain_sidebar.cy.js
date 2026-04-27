import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
// DO NOT use OWNER_2_PRIVATE_KEY for safe creation. Used for CF safes.
const signer2 = walletCredentials.OWNER_2_PRIVATE_KEY

// Some tests are rewritten in multichain_safe_selector.cy.js (balance, address, chain logos, rename for group, rename opens modal).
// Remaining tests dropped: context menus on dropdown rows, remove CF safe, and network tooltip are gone from the new UI.
describe.skip('Multichain sidebar tests', { defaultCommandTimeout: 20000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28)
    cy.wait(2000)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set5WithSingleSafe)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.multichain)
  })

  // Added to multichain_safe_selector.cy.js that matches the new UI.
  it('Verify Rename and Add network options are available for Group of safes', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.clickOnMultichainItemOptionsBtn(0)
    main.verifyElementsIsVisible([sideBar.safeItemOptionsAddChainBtn, sideBar.safeItemOptionsRenameBtn])
  })

  // DROPPED: no context menu on single-safe rows in the new SafeSelectorDropdown.
  it('Verify Give name and Add network options are available for a deployed safe', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.clickOnSafeItemOptionsBtnByIndex(1)
    main.verifyElementsIsVisible([sideBar.safeItemOptionsAddChainBtn, sideBar.safeItemOptionsRenameBtn])
  })

  // DROPPED: no context menu or remove/rename actions on CF safe rows in the new SafeSelectorDropdown.
  it('Verify Give name and Add network options are available for a CF safe', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set6_undeployed_safe)
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safe1)
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.undeployed)
    cy.reload()
    wallet.connectSigner(signer2)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.clickOnSafeItemOptionsBtn(sideBar.undeployedSafe)
    main.verifyElementsIsVisible([sideBar.safeItemOptionsRemoveBtn, sideBar.safeItemOptionsRenameBtn])
  })

  // DROPPED: remove action is gone from the new SafeSelectorDropdown; no equivalent UI to test.
  it('Verify that removed from side bar CF safe is removed from the address book', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_9)
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set6_undeployed_safe)
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__undeployedSafes, ls.undeployedSafe.safe1)
    main.addToAppLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.undeployed)
    cy.reload()
    wallet.connectSigner(signer2)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.removeSafeItem(sideBar.undeployedSafe)
    cy.window({ timeout: 10000 })
      .invoke('localStorage.getItem', constants.localStorageKeys.SAFE_v2__addressBook)
      .should('equal', '{}')
  })

  // DROPPED: add network is now in ChainSelectorBlock, not a dropdown context menu; covered by multichain_networkswitch.cy.js.
  it('Verify "Add network" in more options menu for the single safe', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.clickOnSafeItemOptionsBtnByIndex(1)
    sideBar.checkAddChainDialogDisplayed()
  })

  // DROPPED: add network is now in ChainSelectorBlock, not a dropdown context menu; covered by multichain_networkswitch.cy.js.
  it('Verify "Add Networks" option for the group of safes with multi-chain safe', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.clickOnSafeItemOptionsBtnByIndex(0)
    sideBar.checkAddChainDialogDisplayed()
  })

  // DROPPED: add network button is now in ChainSelectorBlock, not inside the safe selector dropdown; covered by multichain_networkswitch.cy.js.
  it('Verify "Add another network" button in safe group', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    main.verifyElementsExist([sideBar.addNetworkBtn])
  })

  // DROPPED: no context menu exists on any row in the new SafeSelectorDropdown; absence is structural.
  it('Verify there is no Rename option for a safe in the group', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.checkThereIsNoOptionsMenu(0)
  })

  // Added to multichain_safe_selector.cy.js that matches the new UI.
  it('Verify Rename option in the group of safes opens a new edit entry modal', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.clickOnMultichainItemOptionsBtn(0)
    sideBar.clickOnRenameBtn()
  })

  // DROPPED: add network button position is not a concept in the new ChainSelectorBlock flow.
  it('Verify "Add another network" at the end of the group list', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.checkAddNetworkBtnPosition(0)
  })

  // Added to multichain_safe_selector.cy.js that matches the new UI.
  it('Verify balance of the safe group', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.checkSafeGroupBalance(0, '0.73')
  })

  // Added to multichain_safe_selector.cy.js that matches the new UI.
  it('Verify address of the safe group', () => {
    const address = '0xC96e...ee3B'
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.checkSafeGroupAddress(0, address)
  })

  // Added to multichain_safe_selector.cy.js that matches the new UI.
  it('Verify network logo for safes in the group', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.checkSafeGroupIconsExist(0, 3)
  })

  // DROPPED: no network tooltip in the new SafeSelectorDropdown; chain badges are shown inline without a tooltip.
  it('Verify tooltip with networks for multichain safe', () => {
    wallet.connectSigner(signer)
    sideBar.clickOnOpenSidebarBtn()
    sideBar.checkMultichainTooltipExists(0)
  })
})
