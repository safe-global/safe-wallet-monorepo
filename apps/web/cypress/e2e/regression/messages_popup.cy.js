import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as modal from '../pages/modals.page.js'
import * as apps from '../pages/safeapps.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'
import * as messages from '../pages/messages.pages.js'
import * as msg_confirmation_modal from '../pages/modals/message_confirmation.pages.js'

let staticSafes = []
const safeApp = 'Safe Test App'
const onchainMessage = 'Message 1'
let iframeSelector

describe('Messages popup window tests', () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  beforeEach(() => {
    cy.visit(constants.appsCustomUrl + staticSafes.SEP_STATIC_SAFE_10)
    iframeSelector = `iframe[id="iframe-${encodeURIComponent(constants.safeTestAppurl)}"]`
  })

  it('Verify off-chain message popup window can be triggered', () => {
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__customSafeApps_11155111,
      ls.customApps(constants.safeTestAppurl).safeTestApp,
    )
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__SafeApps__browserPermissions,
      ls.appPermissions(constants.safeTestAppurl).grantedPermissions,
    )
    cy.reload()
    apps.clickOnApp(safeApp)
    apps.clickOnOpenSafeAppBtn()
    main.getIframeBody(iframeSelector).within(() => {
      apps.triggetOffChainTx()
    })
    msg_confirmation_modal.verifyConfirmationWindowTitle(modal.modalTitiles.confirmTx)
    msg_confirmation_modal.verifySafeAppInPopupWindow(safeApp)
  })

  it('Verify on-chain message popup window can be triggered', () => {
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__customSafeApps_11155111,
      ls.customApps(constants.safeTestAppurl).safeTestApp,
    )
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__SafeApps__browserPermissions,
      ls.appPermissions(constants.safeTestAppurl).grantedPermissions,
    )

    cy.reload()
    apps.clickOnApp(safeApp)
    apps.clickOnOpenSafeAppBtn()
    main.getIframeBody(iframeSelector).within(() => {
      apps.enterMessage(onchainMessage)
      //messages.enterOnchainMessage(onchainMessage)
      apps.triggetOnChainTx()
    })
    msg_confirmation_modal.verifyConfirmationWindowTitle(modal.modalTitiles.confirmMsg)
    msg_confirmation_modal.verifySafeAppInPopupWindow(safeApp)
    msg_confirmation_modal.verifyMessagePresent(onchainMessage)
  })

  it('Verify warning message is displayed when 0x0000000 is used as a message', () => {
    const msgHash = '0x0000000'
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__customSafeApps_11155111,
      ls.customApps(constants.safeTestAppurl).safeTestApp,
    )
    main.addToLocalStorage(
      constants.localStorageKeys.SAFE_v2__SafeApps__browserPermissions,
      ls.appPermissions(constants.safeTestAppurl).grantedPermissions,
    )
    cy.reload()
    apps.clickOnApp(safeApp)
    apps.clickOnOpenSafeAppBtn()
    main.getIframeBody(iframeSelector).within(() => {
      apps.enterMessage(msgHash)
      apps.triggetSignMsg()
    })
    apps.verifyBlindSigningEnabled(true)
    apps.clickOnBlindSigningOption()
    cy.visit(constants.appsCustomUrl + staticSafes.SEP_STATIC_SAFE_10)
    apps.clickOnApp(safeApp)
    apps.clickOnOpenSafeAppBtn()
    main.getIframeBody(iframeSelector).within(() => {
      apps.enterMessage(msgHash)
      apps.triggetSignMsg()
    })
    apps.verifyBlindSigningEnabled(false)
    apps.verifySignBtnDisabled()
  })
})
