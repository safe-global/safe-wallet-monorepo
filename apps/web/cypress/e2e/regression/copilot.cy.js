import * as copilot from '../pages/copilot.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as ls from '../../support/localstorage_data.js'
import { walletCredentials } from '../../support/credentials.js'

let signer
before(() => {
  signer = walletCredentials.OWNER_4_PRIVATE_KEY
})
let staticSafes = []

describe('Safe Copilot tests', { defaultCommandTimeout: 30000 }, () => {
  before(async () => {
    staticSafes = await getSafes(CATEGORIES.static)
  })

  // ========================================
  // 1. Widget General
  // ========================================

  it('[Widget General] Verify that Risk detected requires Risk Confirmation checkbox to continue', () => {
    copilot.navigateToTransactionAndSetupCopilot(copilot.testTransactions.threatAnalysisMaliciousApproval, signer)

    copilot.verifyRiskDetected()

    // Verify risk confirmation checkbox is unchecked and continue button is disabled
    copilot.verifyRiskConfirmationCheckboxUnchecked()
    copilot.verifyContinueButtonDisabled()

    // Check the risk confirmation checkbox and continue
    copilot.checkRiskConfirmationCheckbox()
    copilot.verifyContinueButtonEnabled()
    createtx.clickOnContinueSignTransactionBtn()
    cy.contains(createtx.txDetailsStr).should('be.visible')
  })

  // ========================================
  // 2. Recipient Analyse
  // ========================================
  //Only 4A - Incompatible Safe version is not covered

  it('[Recipient Analyse] Verify that New recipient is shown for first time interaction - 3A', () => {
    copilot.setupRecipientAnalysis(copilot.testTransactions.recipientAnalysisSafeYouOwn, signer)
    main.verifyTextVisibility([copilot.firstTimeInteractionStr])
  })

  it('[Recipient Analyse] Verify that Recurring recipient is shown with interaction count - 3B', () => {
    copilot.setupRecipientAnalysis(
      copilot.testTransactions.recipientAnalysisKnownUnknown,
      signer,
      ls.addressBookData.safeSchiledAddressBook,
    )
    main.verifyTextVisibility([copilot.recurringRecipientStr, copilot.interactedTwoTimesStr])
  })

  it('[Recipient Analyse] Verify that Missing ownership warning is shown - 4B', () => {
    copilot.setupRecipientAnalysis(
      copilot.testTransactions.recipientAnalysisMissingOwnership,
      signer,
      null,
      staticSafes.MATIC_STATIC_SAFE_28,
    )
    main.verifyTextVisibility([copilot.missingOwnershipStr, copilot.missingOwnershipMessageStr])
  })

  it('[Recipient Analyse] Verify that Unsupported network warning is shown - 4C', () => {
    copilot.setupRecipientAnalysis(copilot.testTransactions.recipientAnalysisUnsupportedNetwork, signer)
    main.verifyTextVisibility([copilot.unsupportedNetworkStr, copilot.unsupportedNetworkMessageStr])
  })

  it('[Recipient Analyse] Verify that Different setup warning is shown - 4D', () => {
    copilot.setupRecipientAnalysis(copilot.testTransactions.recipientAnalysisDifferentSetup, signer)
    main.verifyTextVisibility([copilot.differentSetupMessageStr])
  })

  // ========================================
  // 3. Threat Analyse
  // ========================================

  it('[Threat Analyse] Verify Malicious Approval detection - 9A', () => {
    copilot.navigateToTransactionAndSetupCopilot(copilot.testTransactions.threatAnalysisMaliciousApproval, signer)

    copilot.verifyRiskDetected()
    copilot.verifyThreatAnalysisGroupCard()
    copilot.verifyThreatAnalysisMaliciousState()
    copilot.expandThreatAnalysisCard()
    main.verifyTextVisibility([copilot.drainerApprovalMessageStr, copilot.drainerActivityStr])
  })

  it('[Threat Analyse] Verify Malicious Transfer detection - 9A', () => {
    copilot.navigateToTransactionAndSetupCopilot(copilot.testTransactions.threatAnalysisMaliciousTransfer, signer)

    copilot.verifyRiskDetected()
    copilot.verifyThreatAnalysisGroupCard()
    copilot.verifyThreatAnalysisMaliciousState()
    copilot.expandThreatAnalysisCard()
    main.verifyTextVisibility([copilot.drainerTransferMessageStr, copilot.drainerActivityStr])
  })

  it('[Threat Analyse] Verify Malicious Native Transfer detection - 9A', () => {
    copilot.navigateToTransactionAndSetupCopilot(copilot.testTransactions.threatAnalysisMaliciousNativeTransfer, signer)

    copilot.verifyRiskDetected()
    copilot.verifyThreatAnalysisGroupCard()
    copilot.verifyThreatAnalysisMaliciousState()
    copilot.expandThreatAnalysisCard()
    main.verifyTextVisibility([copilot.drainerNativeTransferMessageStr, copilot.drainerActivityStr])
  })

  it('[Threat Analyse] Verify Malicious wallet_sendCalls detection - 9A', () => {
    copilot.navigateToTransactionAndSetupCopilot(copilot.testTransactions.threatAnalysisMaliciousAddress, signer)

    copilot.verifyRiskDetected()
    copilot.verifyThreatAnalysisGroupCard()
    copilot.verifyThreatAnalysisMaliciousState()
    copilot.expandThreatAnalysisCard()
    main.verifyTextVisibility([copilot.maliciousAddressMessageStr, copilot.maliciousActivityStr])
  })

  //TODO: Add tests for offchain messages when implemented
  // ========================================
  // 4. Contract Analyse
  // ========================================

  // TODO: Add Contract Analyse tests

  // ========================================
  // 5. Tenderly Simulation
  // ========================================

  it('[Tenderly Simulation] Verify success simulation state', () => {
    copilot.navigateToTransactionAndSetupCopilot(copilot.testTransactions.tenderlySimulation, signer)

    copilot.verifyTenderlySimulation()
    cy.get(copilot.tenderlySimulation).should('contain.text', 'Transaction simulation')
    cy.get(copilot.tenderlySimulation, { timeout: 15000 }).find(copilot.runSimulationBtn).click()
    cy.get(copilot.tenderlySimulation).find(copilot.runSimulationBtn).should('contain.text', 'Running...')
    cy.contains('Simulation successful', { timeout: 10000 }).should('be.visible')
    cy.get(copilot.tenderlySimulation).should('contain.text', 'Simulation successful')
    cy.contains('View').should('be.visible')
    cy.get(copilot.tenderlySimulation).find(copilot.runSimulationBtn).should('not.exist')
    main.verifyLinkContainsUrl('View', copilot.tenderlySimulationUrl)
  })

  it('[Tenderly Simulation] Verify failed simulation state', () => {
    copilot.navigateToTransactionAndSetupCopilot(copilot.testTransactions.threatAnalysisFailed, signer)

    copilot.verifyTenderlySimulation()
    cy.get(copilot.tenderlySimulation, { timeout: 15000 }).find(copilot.runSimulationBtn).click()
    cy.get(copilot.tenderlySimulation).find(copilot.runSimulationBtn).should('contain.text', 'Running...')
    cy.contains('Simulation failed', { timeout: 10000 }).should('be.visible')
    cy.get(copilot.tenderlySimulation).should('contain.text', 'Simulation failed')
    cy.contains('View').should('be.visible')
    cy.get(copilot.tenderlySimulation).find(copilot.runSimulationBtn).should('not.exist')
    main.verifyLinkContainsUrl('View', copilot.tenderlySimulationUrl)
  })

  //it('[Tenderly Simulation] Verify original and nested txs simulations in Tenderly card'
})
