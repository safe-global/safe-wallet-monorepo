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

describe('Recovery regression tests', { defaultCommandTimeout: 50000 }, () => {
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

  it('Verify there is no account recovery section in the global settings', () => {
    cy.visit(constants.setupUrl + recoverySafes.SEP_RECOVERY_SAFE_1)
    cy.clearLocalStorage()
    main.acceptCookies()
    main.verifyElementsCount(recovery.setupRecoveryModalBtn, 0)
  })

  it('Verify that non-owner can not edit and delete recovery set up on Security and Login', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    main.acceptCookies()
    recovery.verifyRecoveryTableDisplayed()
    main.verifyElementsCount(recovery.removeRecovererBtn, 0)
    main.verifyElementsCount(recovery.editRecovererBtn, 0)
  })

  it('Verify that non-owner can not delete recovery set up on Modules', () => {
    cy.visit(constants.modulesUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    main.acceptCookies()
    main.verifyElementsStatus([modules.moduleRemoveIcon], constants.enabledStates.disabled)
  })

  it('Verify that guardian can not delete or edit recovery set up on Security and Login', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(guardian)
    main.acceptCookies()
    recovery.postponeRecovery()
    recovery.verifyRecoveryTableDisplayed()
    main.verifyElementsCount(recovery.removeRecovererBtn, 0)
    main.verifyElementsCount(recovery.editRecovererBtn, 0)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that during the first connection to the safe "Proposal to recover account" modal is displayed for the guardian', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(guardian)
    main.acceptCookies()
    recovery.verifyRecoveryProposalModalState(constants.elementExistanceStates.exist)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that "Account recovery" widget is displayed in the header for the Guardian', () => {
    cy.visit(constants.homeUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(guardian)
    main.acceptCookies()
    recovery.clickOnRecoverLaterBtn()
    recovery.verifyRecoveryProposalModalState(constants.elementExistanceStates.exist, true)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that recover later option is cached and "Proposal to account recovery" modal is not displayed on next safe opening', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(guardian)
    main.acceptCookies()
    recovery.clickOnRecoverLaterBtn()
    cy.reload()
    recovery.verifyRecoveryProposalModalState(constants.elementExistanceStates.not_exist)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that "Proposal to account recovery" modal is not displayed if the user is not guardian', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.verifyRecoveryProposalModalState(constants.elementExistanceStates.not_exist)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that the guardian can not delete recovery set up on Modules', () => {
    cy.visit(constants.modulesUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(guardian)
    main.acceptCookies()
    recovery.postponeRecovery()
    main.verifyElementsStatus([modules.moduleRemoveIcon], constants.enabledStates.disabled)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify initial and edited recovery settings', () => {
    const address = '0x9445...F1BA'
    const settings = [address, recovery.recoveryOptions.fiveSixDays, recovery.recoveryOptions.never]
    const confirmationData = [recovery.recoveryOptions.fiveMin, recovery.recoveryOptions.oneHr]
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.verifyRecoveryTableDisplayed()
    recovery.verifyRecovererSettings(settings)
    recovery.clickOnEditRecoverer()
    recovery.clickOnNextBtn()
    recovery.setRecoveryDelay(recovery.recoveryOptions.fiveMin)
    recovery.setRecoveryExpiry(recovery.recoveryOptions.oneHr)
    recovery.agreeToTerms()
    recovery.clickOnNextBtn()
    recovery.verifyRecovererConfirmationData(confirmationData)
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that set up recovery flow can be canceled before submitting tx', () => {
    cy.visit(constants.securityUrl + staticSafes.SEP_STATIC_SAFE_13)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.clickOnSetupRecoveryBtn()
    recovery.clickOnSetupRecoveryModalBtn()
    recovery.clickOnNextBtn()
    recovery.enterRecovererAddress(getMockAddress())
    recovery.agreeToTerms()
    recovery.clickOnNextBtn()
    navigation.clickOnModalCloseBtn(0)
    recovery.getSetupRecoveryBtn()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify Recovery delay and Expiry options are present during recovery setup', () => {
    const options = [
      recovery.recoveryOptions.customPeriod,
      recovery.recoveryOptions.oneMin,
      recovery.recoveryOptions.fiveMin,
      recovery.recoveryOptions.oneHr,
      recovery.recoveryOptions.twoDays,
      recovery.recoveryOptions.sevenDays,
      recovery.recoveryOptions.fourteenDays,
      recovery.recoveryOptions.twentyEightDays,
      recovery.recoveryOptions.fiveSixDays,
    ]
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(signer)
    main.acceptCookies()
    recovery.verifyRecoveryTableDisplayed()
    recovery.clickOnEditRecoverer()
    recovery.clickOnNextBtn()
    recovery.verifyRecoveryDelayOptions(options)
    cy.get('body').click()
    recovery.verifyRecoveryExpiryOptions(options.slice(1))
    cy.get('body').click()
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it('Verify that recovery tx is opened after clicking on "Start recovery" button in the widget', () => {
    cy.visit(constants.securityUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    cy.clearLocalStorage()
    wallet.connectSigner(guardian)
    main.acceptCookies()
    recovery.clickOnRecoverLaterBtn()
    cy.visit(constants.homeUrl + recoverySafes.SEP_RECOVERY_SAFE_4)
    recovery.clickOnStartRecoveryBtn()
    recovery.enterRecovererAddress(getMockAddress())
    navigation.clickOnWalletExpandMoreIcon()
    navigation.clickOnDisconnectBtn()
  })

  it.skip('Verify that the Security section contains Account recovery block on supported netwroks', () => {
    const safes = [
      staticSafes.ETH_STATIC_SAFE_15,
      staticSafes.GNO_STATIC_SAFE_16,
      staticSafes.MATIC_STATIC_SAFE_17,
      staticSafes.SEP_STATIC_SAFE_13,
    ]

    safes.forEach((safe) => {
      cy.visit(constants.prodbaseUrl + constants.securityUrl + safe)
      recovery.getSetupRecoveryBtn()
    })
  })

  it('Verify that the Security and Login section does not contain Account recovery block on unsupported networks', () => {
    const safes = [
      staticSafes.BNB_STATIC_SAFE_18,
      staticSafes.AURORA_STATIC_SAFE_19,
      staticSafes.AVAX_STATIC_SAFE_20,
      staticSafes.LINEA_STATIC_SAFE_21,
      staticSafes.ZKSYNC_STATIC_SAFE_22,
    ]

    safes.forEach((safe) => {
      cy.visit(constants.prodbaseUrl + constants.securityUrl + safe)
      main.verifyElementsCount(recovery.setupRecoveryBtn, 0)
    })
  })
})
