import * as constants from '../../support/constants.js'
import * as shield from '../pages/safe_shield.pages.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as main from '../pages/main.page.js'
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

  it('[Widget General] Verify that Risk detected requires Risk Confirmation checkbox to continue', () => {
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

    // Verify risk confirmation checkbox is unchecked and continue button is disabled
    shield.verifyRiskConfirmationCheckboxUnchecked()
    shield.verifyContinueButtonDisabled()

    // Check the risk confirmation checkbox and continue
    shield.checkRiskConfirmationCheckbox()
    shield.verifyContinueButtonEnabled()
    createtx.clickOnContinueSignTransactionBtn()
    cy.contains(createtx.txDetailsStr).should('be.visible')
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
    main.verifyTextNotVisible(['Malicious threat detected', 'Threat analysis failed'])
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
    main.verifyTextVisibility([shield.maliciousApprovalMessageStr, shield.walletDrainerBehaviorStr])
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
    main.verifyTextVisibility([shield.maliciousTransferMessageStr, shield.walletDrainerBehaviorStr])
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
    main.verifyTextVisibility([shield.maliciousNativeTransferMessageStr, shield.walletDrainerBehaviorStr])
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
    main.verifyTextVisibility([shield.maliciousAddressMessageStr, shield.maliciousActivityStr])
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
    main.verifyTextVisibility([shield.maliciousAddressMessageStr, shield.maliciousActivityStr])
  })
  //TODO: Add tests for offchain messages when implemented
  // ========================================
  // 4. Contract Analyse
  // ========================================

  // TODO: Add Contract Analyse tests

  // ========================================
  // 5. Tenderly Simulation
  // ========================================

  it('[Tenderly Simulation] Verify that tenderly section is presented in the safe shield', () => {
    cy.visit(constants.transactionUrl + staticSafes.MATIC_STATIC_SAFE_30 + shield.testTransactions.tenderlySimulation)
    wallet.connectSigner(signer)
    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()
    shield.verifyTenderlySimulation()
    cy.get(shield.tenderlySimulation).should('contain.text', 'Transaction simulation')
    cy.get(shield.tenderlySimulation).find(shield.runSimulationBtn).should('be.visible')
    cy.contains('Run').should('be.visible')
  })

  it('[Tenderly Simulation] Verify success simulation state', () => {
    cy.visit(constants.transactionUrl + staticSafes.MATIC_STATIC_SAFE_30 + shield.testTransactions.tenderlySimulation)
    wallet.connectSigner(signer)
    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()
    shield.verifyTenderlySimulation()
    cy.get(shield.tenderlySimulation, { timeout: 15000 }).find(shield.runSimulationBtn).click()
    cy.get(shield.tenderlySimulation).find(shield.runSimulationBtn).should('contain.text', 'Running...')
    cy.contains('Simulation successful', { timeout: 10000 }).should('be.visible')
    cy.get(shield.tenderlySimulation).should('contain.text', 'Simulation successful')
    cy.contains('View').should('be.visible')
    cy.get(shield.tenderlySimulation).find(shield.runSimulationBtn).should('not.exist')
    main.verifyLinkContainsUrl('View', shield.tenderlySimulationUrl)
  })

  it('[Tenderly Simulation] Verify failed simulation state', () => {
    cy.visit(constants.transactionUrl + staticSafes.MATIC_STATIC_SAFE_30 + shield.testTransactions.threatAnalysisFailed)
    wallet.connectSigner(signer)
    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()
    shield.verifyTenderlySimulation()
    cy.get(shield.tenderlySimulation, { timeout: 15000 }).find(shield.runSimulationBtn).click()
    cy.get(shield.tenderlySimulation).find(shield.runSimulationBtn).should('contain.text', 'Running...')
    cy.contains('Simulation failed', { timeout: 10000 }).should('be.visible')
    cy.get(shield.tenderlySimulation).should('contain.text', 'Simulation failed')
    cy.contains('View').should('be.visible')
    cy.get(shield.tenderlySimulation).find(shield.runSimulationBtn).should('not.exist')
    main.verifyLinkContainsUrl('View', shield.tenderlySimulationUrl)
  })

  //it('[Tenderly Simulation] Verify original and nested txs simulations in Tenderly card'
})
