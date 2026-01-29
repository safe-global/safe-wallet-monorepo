import * as constants from '../../support/constants.js'
import * as shield from '../pages/copilot.js'
import * as createtx from '../pages/create_tx.pages.js'
import * as main from '../pages/main.page.js'
import { getSafes, CATEGORIES } from '../../support/safes/safesHandler.js'
import * as wallet from '../../support/utils/wallet.js'
import * as ls from '../../support/localstorage_data.js'

const walletCredentials = JSON.parse(Cypress.env('CYPRESS_WALLET_CREDENTIALS'))
const signer = walletCredentials.OWNER_4_PRIVATE_KEY
let staticSafes = []

describe('Safe Copilot tests', { defaultCommandTimeout: 30000 }, () => {
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

  // Helper function for common recipient analysis test setup
  const setupRecipientAnalysisTest = (transactionId, addressBookData = null) => {
    if (addressBookData) {
      main.addToLocalStorage(constants.localStorageKeys.SAFE_v2__addressBook, addressBookData)
    }

    cy.visit(constants.transactionUrl + staticSafes.MATIC_STATIC_SAFE_30 + transactionId)
    wallet.connectSigner(signer)

    createtx.clickOnConfirmTransactionBtn()
    shield.verifySafeShieldDisplayed()
    shield.waitForAnalysisComplete()
    shield.verifyRecipientAnalysisGroupCard()
    shield.expandRecipientAnalysisCard()
  }

  it('[Recipient Analyse] Verify that Known recipient is shown when address is in address book - 1A', () => {
    setupRecipientAnalysisTest(
      shield.testTransactions.recipientAnalysisKnownUnknown,
      ls.addressBookData.safeSchiledAddressBook,
    )
    main.verifyTextVisibility([shield.addressInAddressBookStr])
  })

  it('[Recipient Analyse] Verify that Known recipient is shown when recipient is a Safe you own - 1A', () => {
    setupRecipientAnalysisTest(shield.testTransactions.recipientAnalysisSafeYouOwn)
    main.verifyTextVisibility([shield.addressIsSafeYouOwnStr])
  })

  it('[Recipient Analyse] Verify that Unknown recipient is shown when address is not in address book - 1B', () => {
    setupRecipientAnalysisTest(shield.testTransactions.recipientAnalysisKnownUnknown)
    main.verifyTextVisibility([shield.unknownRecipientStr, shield.addressNotInAddressBookStr])
  })

  it('[Recipient Analyse] Verify that New recipient is shown for first time interaction - 3A', () => {
    setupRecipientAnalysisTest(shield.testTransactions.recipientAnalysisSafeYouOwn)
    main.verifyTextVisibility([shield.firstTimeInteractionStr])
  })

  it('[Recipient Analyse] Verify that Recurring recipient is shown with interaction count - 3B', () => {
    setupRecipientAnalysisTest(
      shield.testTransactions.recipientAnalysisKnownUnknown,
      ls.addressBookData.safeSchiledAddressBook,
    )
    main.verifyTextVisibility([shield.recurringRecipientStr, shield.interactedTwoTimesStr])
  })

  it('[Recipient Analyse] Verify that Low activity recipient warning is shown for address with few transactions - 2', () => {
    setupRecipientAnalysisTest(shield.testTransactions.recipientAnalysisLowActivity)
    main.verifyTextVisibility([shield.lowActivityRecipientStr, shield.fewTransactionsStr])
  })

  it('[Recipient Analyse] Verify that Missing ownership warning is shown - 4B', () => {
    setupRecipientAnalysisTest(shield.testTransactions.recipientAnalysisMissingOwnership)
    main.verifyTextVisibility([shield.missingOwnershipStr, shield.missingOwnershipMessageStr])
  })

  it('[Recipient Analyse] Verify that Unsupported network warning is shown - 4C', () => {
    setupRecipientAnalysisTest(shield.testTransactions.recipientAnalysisUnsupportedNetwork)
    main.verifyTextVisibility([shield.unsupportedNetworkStr, shield.unsupportedNetworkMessageStr])
  })

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
    main.verifyTextVisibility([shield.drainerApprovalMessageStr, shield.drainerActivityStr])
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
    main.verifyTextVisibility([shield.drainerTransferMessageStr, shield.drainerActivityStr])
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
    main.verifyTextVisibility([shield.drainerNativeTransferMessageStr, shield.drainerActivityStr])
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
