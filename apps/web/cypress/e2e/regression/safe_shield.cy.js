import * as constants from '../../support/constants.js'
import * as shield from '../pages/safe_shield.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
let staticSafes = []

describe('Safe Shield tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })
  // ========================================
  // 1. Widget General
  // ========================================

  it('[Widget General] Verify that Safe Shield empty state is shown on New Transaction start before scanning', () => {
    cy.visit(constants.BALANCE_URL + staticSafes.MATIC_STATIC_SAFE_30)
    wallet.connectSigner(signer)
    createtx.clickOnNewtransactionBtn()
    createtx.clickOnSendTokensBtn()
    shield.verifySafeShieldDisplayed()
    shield.verifyEmptyState()
    shield.verifySecuredByFooter()
  })

  // ========================================
  // 2. Recipient Analyse
  // ========================================

  // TODO: Add Recipient Analyse tests

  // ========================================
  // 3. Threat Analyse
  // ========================================

  it('[Threat Analyse] Verify that Safe Shield shows warning details for reverted txs-9B', () => {
    cy.visit(constants.transactionUrl + staticSafes.MATIC_STATIC_SAFE_30 + shield.testTransactions.threatAnalysisFailed)
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()

    shield.verifyIssuesFoundWarningHeader()
    shield.verifyThreatAnalysisGroupCard()
    shield.verifyThreatAnalysisWarningState()
    shield.expandThreatAnalysisCard()
    shield.verifyThreatAnalysisFailedDetails()
  })

  it('[Threat Analyse] Verify that Safe Shield shows no threat detected-9C', () => {
    cy.visit(
      constants.transactionUrl + staticSafes.MATIC_STATIC_SAFE_30 + shield.testTransactions.threatAnalysisNoThreat,
    )
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()

    shield.verifyThreatAnalysisGroupCard()
    shield.verifyThreatAnalysisNoThreatState()
    shield.expandThreatAnalysisCard()
    shield.verifyThreatAnalysisFoundNoIssues()
  })

  it('[Threat Analyse] Verify Malicious Approval detection - 9A', () => {
    cy.visit(
      constants.transactionUrl +
        staticSafes.MATIC_STATIC_SAFE_30 +
        shield.testTransactions.threatAnalysisMaliciousApproval,
    )
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()

    shield.verifyRiskDetected()
    shield.verifyThreatAnalysisGroupCard()
    shield.verifyThreatAnalysisMaliciousState()
    shield.expandThreatAnalysisCard()
    shield.verifyMaliciousApprovalDetails()
  })

  it('[Threat Analyse] Verify Malicious Transfer detection - 9A', () => {
    cy.visit(
      constants.transactionUrl +
        staticSafes.MATIC_STATIC_SAFE_30 +
        shield.testTransactions.threatAnalysisMaliciousTransfer,
    )
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()

    shield.verifyRiskDetected()
    shield.verifyThreatAnalysisGroupCard()
    shield.verifyThreatAnalysisMaliciousState()
    shield.expandThreatAnalysisCard()
    shield.verifyMaliciousTransferDetails()
  })

  it('[Threat Analyse] Verify Malicious Native Transfer detection - 9A', () => {
    cy.visit(
      constants.transactionUrl +
        staticSafes.MATIC_STATIC_SAFE_30 +
        shield.testTransactions.threatAnalysisMaliciousNativeTransfer,
    )
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()

    shield.verifyRiskDetected()
    shield.verifyThreatAnalysisGroupCard()
    shield.verifyThreatAnalysisMaliciousState()
    shield.expandThreatAnalysisCard()
    shield.verifyMaliciousNativeTransferDetails()
  })

  it('[Threat Analyse] Verify Malicious wallet_sendCalls detection - 9A', () => {
    cy.visit(
      constants.transactionUrl +
        staticSafes.MATIC_STATIC_SAFE_30 +
        shield.testTransactions.threatAnalysisMaliciousAddress,
    )
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()

    shield.verifyRiskDetected()
    shield.verifyThreatAnalysisGroupCard()
    shield.verifyThreatAnalysisMaliciousState()
    shield.expandThreatAnalysisCard()
    shield.verifyMaliciousAddressDetails()
  })

  it('[Threat Analyse] Verify Malicious wallet_sendCalls(Eth) detection - 9A', () => {
    cy.visit(
      constants.transactionUrl +
        staticSafes.MATIC_STATIC_SAFE_30 +
        shield.testTransactions.threatAnalysisMaliciousAddressEth,
    )
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()

    shield.verifyRiskDetected()
    shield.verifyThreatAnalysisGroupCard()
    shield.verifyThreatAnalysisMaliciousState()
    shield.expandThreatAnalysisCard()
    shield.verifyMaliciousAddressDetails()
  })

  // ========================================
  // 4. Contract Analyse
  // ========================================

  // TODO: Add Contract Analyse tests

  // ========================================
  // 5. Tenderly Simulation
  // ========================================

  // TODO: Add Tenderly Simulation tests
})
