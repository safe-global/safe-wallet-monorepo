import * as constants from '../../support/constants'
import * as main from '../pages/main.page'
import * as createwallet from '../pages/create_wallet.pages'
import * as owner from '../pages/owners.pages'
import * as ls from '../../support/localstorage_data.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

let staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
// DO NOT use OWNER_2_PRIVATE_KEY for safe creation. Used for CF safes.
const signer = walletCredentials.OWNER_2_PRIVATE_KEY

describe('CF Safe regression tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  const seedUndeployedSafe = (win) =>
    win.localStorage.setItem(
      constants.localStorageKeys.SAFE_v2__undeployedSafes,
      JSON.stringify(ls.undeployedSafe.safe1),
    )
  const undeployedSafeStorage = { [constants.localStorageKeys.SAFE_v2__undeployedSafes]: ls.undeployedSafe.safe1 }

  it('Verify "0 out of 2 step completed" is shown in the dashboard', () => {
    cy.visit(constants.homeUrl + staticSafes.SEP_STATIC_SAFE_0, { onBeforeLoad: seedUndeployedSafe })
    createwallet.checkInitialStepsDisplayed()
  })

  it('Verify "Add native assets" button opens a modal with a QR code and the safe address', () => {
    wallet.connectSignerViaStorage(signer, constants.homeUrl + staticSafes.SEP_STATIC_SAFE_0, {
      extraStorage: undeployedSafeStorage,
    })
    owner.waitForConnectionStatus()
    createwallet.clickOnAddFundsBtn()
    main.verifyElementsIsVisible([createwallet.qrCode, createwallet.addressInfo])
  })

  it('Verify QR code switch status change works in "Add native assets" modal', () => {
    wallet.connectSignerViaStorage(signer, constants.homeUrl + staticSafes.SEP_STATIC_SAFE_0, {
      extraStorage: undeployedSafeStorage,
    })
    owner.waitForConnectionStatus()
    createwallet.clickOnAddFundsBtn()
    createwallet.checkQRCodeSwitchStatus(constants.checkboxStates.unchecked)
    createwallet.clickOnQRCodeSwitch()
    createwallet.checkQRCodeSwitchStatus(constants.checkboxStates.checked)
  })

  it('Verify "Notifications" in the settings are disabled', () => {
    cy.visit(constants.notificationsUrl + staticSafes.SEP_STATIC_SAFE_0, { onBeforeLoad: seedUndeployedSafe })
    createwallet.checkNotificationsSwitchIs(constants.enabledStates.disabled)
  })

  it('Verify in assets, that a "Add funds" block is present', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_0, { onBeforeLoad: seedUndeployedSafe })
    main.verifyElementsIsVisible([createwallet.addFundsSection, createwallet.noTokensAlert])
  })

  it('Verify clicking on "Activate now" button opens safe activation flow', () => {
    wallet.connectSignerViaStorage(signer, constants.BALANCE_URL + staticSafes.SEP_STATIC_SAFE_0, {
      extraStorage: undeployedSafeStorage,
    })
    owner.waitForConnectionStatus()
    createwallet.clickOnActivateAccountBtn(1)
    cy.contains(createwallet.deployWalletStr)
  })
})
