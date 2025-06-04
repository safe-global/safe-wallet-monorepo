import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as sideBar from '../pages/sidebar.pages.js'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as navigation from '../pages/navigation.page.js'
import * as create_wallet from '../pages/create_wallet.pages.js'
import * as owner from '../pages/owners.pages.js'

import { suspendOutreachModal } from '../pages/modals.page.js'

let staticSafes = []

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
// DO NOT use OWNER_2_PRIVATE_KEY for safe creation. Used for CF safes.
const signer2 = walletCredentials.OWNER_2_PRIVATE_KEY

describe('Multichain setup tests', { defaultCommandTimeout: 60000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_28)
    cy.wait(2000)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addedSafes, ls.addedSafes.set5)
    main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, ls.addressBookData.multichain)
    wallet.connectSigner(signer)
  })

  it('Verify that batch tx with safe activation is not allowed for the CF safes', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'eth')
    sideBar.openSidebar()
    sideBar.addNetwork(constants.networks.ethereum)
    cy.contains(sideBar.createSafeMsg(constants.networks.ethereum))
    sideBar.checkUndeployedSafeExists(0).click()
    main.verifyElementsCount(navigation.newTxBtn, 0)
    main.verifyElementsCount(create_wallet.activateAccountBtn, 2)
    cy.visit(constants.setupUrl + safe)
    owner.verifyManageSignersBtnIsDisabled()
    sideBar.verifyNavItemDisabled(sideBar.sideBarListItems[4])
    sideBar.verifyNavItemDisabled(sideBar.sideBarListItems[6])
  })

  it('Verify notification if the owner set up was changed in original safe', () => {
    sideBar.openSidebar()
    sideBar.addNetwork(constants.networks.ethereum)
    cy.contains(sideBar.createSafeMsg(constants.networks.ethereum))
    cy.visit(constants.homeUrl + staticSafes.MATIC_STATIC_SAFE_28)
    sideBar.checkInconsistentSignersMsgDisplayed(constants.networks.ethereum)
  })

  it('Verify warning on add owner for one safe in the group', () => {
    cy.visit(constants.setupUrl + staticSafes.MATIC_STATIC_SAFE_28)
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(constants.SEPOLIA_OWNER_2)
    owner.clickOnNextBtn()
    sideBar.checkInconsistentSignersMsgDisplayedConfirmTxView(constants.networks.polygon)
  })

  it('Verify warning on add owner for one safe in the group', () => {
    cy.visit(constants.setupUrl + staticSafes.MATIC_STATIC_SAFE_28)
    owner.openAddOwnerWindow()
    owner.typeOwnerAddress(constants.SEPOLIA_OWNER_2)
    owner.clickOnNextBtn()
    sideBar.checkInconsistentSignersMsgDisplayedConfirmTxView(constants.networks.polygon)
  })

  it('Verify warning on remove owner for one safe in the group', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.setupUrl + safe)

    owner.waitForConnectionStatus()
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    suspendOutreachModal()
    owner.openRemoveOwnerWindow(1)
    cy.wait(1000)
    create_wallet.clickOnNextBtn()
    sideBar.checkInconsistentSignersMsgDisplayedConfirmTxView(constants.networks.sepolia)
  })

  it('Verify warning on change policy for one safe in the group', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.setupUrl + safe)
    owner.waitForConnectionStatus()
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    suspendOutreachModal()
    owner.clickOnChangeThresholdBtn()
    create_wallet.updateThreshold(2)
    owner.clickOnThresholdNextBtn()
    sideBar.checkInconsistentSignersMsgDisplayedConfirmTxView(constants.networks.sepolia)
  })

  it('Verify warning on swap owner for one safe in the group', () => {
    let safe = main.changeSafeChainName(staticSafes.MATIC_STATIC_SAFE_28, 'sep')
    cy.visit(constants.setupUrl + safe)
    owner.waitForConnectionStatus()
    navigation.verifyTxBtnStatus(constants.enabledStates.enabled)
    suspendOutreachModal()
    owner.openReplaceOwnerWindow(1)
    owner.typeOwnerAddress(constants.SEPOLIA_OWNER_2)
    cy.wait(2000)
    owner.clickOnNextBtn()
    sideBar.checkInconsistentSignersMsgDisplayedConfirmTxView(constants.networks.sepolia)
  })
})
