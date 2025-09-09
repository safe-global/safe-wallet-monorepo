import * as constants from '../../support/constants.js'
import * as main from '../pages/main.page.js'
import * as owner from '../pages/owners.pages.js'
import * as recovery from '../pages/recovery.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as modules from '../pages/modules.page.js'
import * as navigation from '../pages/navigation.page.js'
import { getMockAddress } from '../../support/utils/ethers.js'

let recoverySafes,
  staticSafes = []
const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
const guardian = walletCredentials.OWNER_2_PRIVATE_KEY

describe('Recovery regression tests 2', { defaultCommandTimeout: 50000 }, () => {
  before(() => {
    getSafes(CATEGORIES.recovery)
      .then((recoveries) => {
        recoverySafes = recoveries
        return getSafes(CATEGORIES.static)
      })
      .then((statics) => {
        staticSafes = statics
      })
  })

  it('Verify "Edit Recovery" flow start from the Recovery widget', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.verifyRecoveryTableDisplayed()
    recovery.clickOnEditRecoverer()
    recovery.verifyRecoveryModalDisplayed()
  })

  it('Verify that Recovery widget has "Edit recovery" button when the recovery module is enabled', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.verifyRecoveryTableDisplayed()
    main.verifyElementsCount(recovery.editRecovererBtn, 1)
  })

  it('Verify that the "Set up recovery" button starts the set up recovery flow when no enabled recovery module in the safe', () => {
    cy.visit(constants.securityUrl + staticSafes.SEP_STATIC_SAFE_13)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.clickOnSetupRecoveryBtn()
    recovery.verifyRecoveryModalDisplayed()
  })

  it('Verify that there is validation for the Guardian address field', () => {
    cy.visit(constants.securityUrl + staticSafes.SEP_STATIC_SAFE_13)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.clickOnSetupRecoveryBtn()
    recovery.clickOnNextBtn()

    recovery.enterRecovererAddress(main.generateRandomString(10), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidFormat)

    recovery.enterRecovererAddress(getMockAddress().replace('A', 'a'), 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.invalidChecksum)

    recovery.enterRecovererAddress(constants.ENS_TEST_SEPOLIA_INVALID, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.failedResolve)

    recovery.enterRecovererAddress(staticSafes.SEP_STATIC_SAFE_13, 1)
    owner.verifyErrorMsgInvalidAddress(constants.addressBookErrrMsg.ownSafeGuardian)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })
})
